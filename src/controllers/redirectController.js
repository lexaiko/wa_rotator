import prisma from '../config/prisma.js';
import cacheService from '../services/cacheService.js';
import RotatorEngine from '../services/rotatorEngine.js';
import GeoService from '../services/geoService.js';
import UserAgentService from '../services/userAgentService.js';
import MessageService from '../services/messageService.js';
import SpamProtectionService from '../services/spamProtectionService.js';

export class RedirectController {
  static async handleRedirect(req, res) {
    const slug = req.params.slug;

    // Cegah browser meng-cache respon redirect agar setiap klik selalu dirotasi
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

    try {
      const campaign = await cacheService.getCampaign(slug);

      // Jika kampanye tidak aktif/tidak ada, redirect langsung ke nomor fallback default
      if (!campaign || !campaign.is_active) {
        const defaultFallback = process.env.DEFAULT_FALLBACK_NUMBER || '6281234567890';
        const fallbackUrl = `https://wa.me/${defaultFallback}?text=${encodeURIComponent('Halo, saya ingin tanya info paket wisata.')}`;
        return res.redirect(302, fallbackUrl);
      }

      // 1. Deteksi Info Pengunjung (IP, Geo, Device, Channel Sosmed)
      const ip = GeoService.getClientIp(req);
      const geo = GeoService.lookup(ip);
      const userAgent = req.headers['user-agent'] || '';
      const ua = UserAgentService.parse(userAgent);
      const channel = UserAgentService.detectChannel(req);

      // 2. Proteksi Anti-Spam & Bot Scraper
      const isBot = SpamProtectionService.isBot(userAgent);
      const rateLimitStatus = SpamProtectionService.checkRateLimit(ip);

      // 3. Pilih CS berdasarkan algoritma rotasi & status aktif
      const rotationResult = RotatorEngine.selectCS(campaign, {
        ip,
        city: geo.city,
        province: geo.province
      });

      let targetPhone = '';
      let targetName = 'Admin';
      let csId = null;

      if (rotationResult.isFallback) {
        targetPhone = rotationResult.fallbackNumber || process.env.DEFAULT_FALLBACK_NUMBER || '6281234567890';
        targetName = 'Admin';
      } else if (rotationResult.selected) {
        const cs = rotationResult.selected.cs;
        targetPhone = cs.phone_number;
        targetName = cs.name;
        csId = cs.id;
      }

      // 4. Susun Pesan Dinamis & WhatsApp Click-to-Chat URL
      const messageTemplate = rotationResult.selected?.custom_message || campaign.message_template;
      const formattedMessage = MessageService.formatMessage(messageTemplate, {
        csName: targetName,
        city: geo.city,
        channel,
        campaignTitle: campaign.title,
        slug: campaign.slug
      });

      const waUrl = MessageService.buildWhatsAppUrl(targetPhone, formattedMessage);

      // 5. Async Click Logging & Counter (Hanya catat jika bukan Bot dan bukan Spam Clicks)
      if (!isBot && !rateLimitStatus.isSpam) {
        (async () => {
          try {
            await prisma.clickLog.create({
              data: {
                campaign_id: campaign.id,
                cs_id: csId,
                ip_address: ip,
                user_agent: userAgent,
                device_type: ua.deviceType,
                os: ua.os,
                browser: ua.browser,
                country: geo.country,
                province: geo.province,
                city: geo.city,
                referrer: req.headers['referer'] || null,
                utm_source: req.query.utm_source || channel,
                utm_medium: req.query.utm_medium || null,
                utm_campaign: req.query.utm_campaign || null,
                utm_content: req.query.utm_content || null,
                utm_term: req.query.utm_term || null,
                redirect_url: waUrl
              }
            });

            // Increment counter lead CS hari ini jika bukan sticky hit
            if (csId && !rotationResult.isSticky) {
              await prisma.cSAdmin.update({
                where: { id: csId },
                data: { today_lead_count: { increment: 1 } }
              });
            }
          } catch (logErr) {
            console.error('Async logging error:', logErr.message);
          }
        })();
      }

      // 6. Opsi Mode 1: Direct 302 Instan (Default & Tercepat)
      if (campaign.redirect_mode === 'DIRECT_302') {
        return res.redirect(302, waUrl);
      }

      // 7. Opsi Mode 2: Interstitial Screen Modern (Responsif Mobile + Light & Dark Mode)
      return res.send(`
        <!DOCTYPE html>
        <html lang="id">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
          <meta name="theme-color" content="#25D366">
          <title>Menghubungkan ke WhatsApp...</title>
          
          <!-- Meta Pixel Code -->
          ${campaign.pixel_fb_id ? `
          <script>
            !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
            n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,
            document,'script','https://connect.facebook.net/en_US/fbevents.js');
            fbq('init', '${campaign.pixel_fb_id}');
            fbq('track', 'PageView');
            fbq('track', 'Lead', { content_name: '${campaign.title}', cs_assigned: '${targetName}' });
          </script>
          ` : ''}

          <!-- TikTok Pixel Code -->
          ${campaign.pixel_tiktok_id ? `
          <script>
            !function (w, d, t) {
              w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie"],ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e},ttq.load=function(e,n){var i="https://analytics.tiktok.com/i18n/pixel/events.js";ttq._i=ttq._i||{},ttq._i[e]=[],ttq._i[e]._u=i,ttq._t=ttq._t||{},ttq._t[e]=+new Date,ttq._o=ttq._o||{},ttq._o[e]=n||{};var o=document.createElement("script");o.type="text/javascript",o.async=!0,o.src=i+"?sdkid="+e+"&lib="+t;var a=document.getElementsByTagName("script")[0];a.parentNode.insertBefore(o,a)};
              ttq.load('${campaign.pixel_tiktok_id}');
              ttq.page();
              ttq.track('Contact');
            }(window, document, 'ttq');
          </script>
          ` : ''}

          <style>
            :root {
              --bg: #F8FAFC;
              --card-bg: rgba(255, 255, 255, 0.95);
              --card-border: rgba(37, 211, 102, 0.2);
              --text-main: #0F172A;
              --text-muted: #64748B;
              --pill-bg: #F1F5F9;
              --shadow: 0 20px 40px -15px rgba(0, 0, 0, 0.08), 0 0 1px 1px rgba(0,0,0,0.05);
            }

            @media (prefers-color-scheme: dark) {
              :root {
                --bg: #0B0F19;
                --card-bg: rgba(17, 24, 39, 0.95);
                --card-border: rgba(37, 211, 102, 0.25);
                --text-main: #F8FAFC;
                --text-muted: #94A3B8;
                --pill-bg: rgba(30, 41, 59, 0.8);
                --shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.6);
              }
            }

            * { box-sizing: border-box; margin: 0; padding: 0; }
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
              background-color: var(--bg);
              color: var(--text-main);
              min-height: 100vh;
              display: flex;
              align-items: center;
              justify-content: center;
              padding: 16px;
              background-image: radial-gradient(circle at 50% 20%, rgba(37, 211, 102, 0.08) 0%, transparent 60%);
            }

            .container {
              width: 100%;
              max-width: 380px;
              margin: 0 auto;
            }

            .card {
              background: var(--card-bg);
              backdrop-filter: blur(20px);
              -webkit-backdrop-filter: blur(20px);
              border: 1px solid var(--card-border);
              border-radius: 24px;
              padding: 36px 24px 30px;
              text-align: center;
              box-shadow: var(--shadow);
              position: relative;
              overflow: hidden;
            }

            /* Progress top bar */
            .progress-bar {
              position: absolute;
              top: 0;
              left: 0;
              height: 3px;
              background: linear-gradient(90deg, #25D366, #128C7E, #25D366);
              width: 0%;
              animation: loadProgress 0.35s ease-out forwards;
            }

            @keyframes loadProgress {
              0% { width: 0%; }
              100% { width: 100%; }
            }

            /* Pulse Ring Spinner with Static Centered Icon */
            .spinner-wrapper {
              position: relative;
              width: 76px;
              height: 76px;
              margin: 0 auto 20px;
              display: flex;
              align-items: center;
              justify-content: center;
            }
            .ring-pulse {
              position: absolute;
              inset: 0;
              border-radius: 50%;
              background: rgba(37, 211, 102, 0.15);
              animation: pulseRing 1.5s cubic-bezier(0.215, 0.61, 0.355, 1) infinite;
            }
            .spinner-ring {
              position: absolute;
              width: 64px;
              height: 64px;
              border-radius: 50%;
              border: 3px solid rgba(37, 211, 102, 0.18);
              border-top-color: #25D366;
              border-right-color: #128C7E;
              animation: spin 0.85s linear infinite;
              z-index: 1;
            }
            .icon-center {
              position: relative;
              z-index: 2;
              width: 48px;
              height: 48px;
              border-radius: 50%;
              background: var(--card-bg);
              display: flex;
              align-items: center;
              justify-content: center;
              box-shadow: inset 0 0 10px rgba(0,0,0,0.03);
            }
            .wa-icon {
              width: 28px;
              height: 28px;
              fill: #25D366;
            }

            @keyframes spin { to { transform: rotate(360deg); } }
            @keyframes pulseRing {
              0% { transform: scale(0.85); opacity: 0.8; }
              50% { transform: scale(1.25); opacity: 0; }
              100% { transform: scale(0.85); opacity: 0; }
            }

            h1 {
              font-size: 17px;
              font-weight: 700;
              margin-bottom: 6px;
              letter-spacing: -0.01em;
            }
            p.subtitle {
              font-size: 12px;
              color: var(--text-muted);
              margin-bottom: 20px;
            }

            /* CS Pill */
            .cs-pill {
              display: inline-flex;
              align-items: center;
              gap: 8px;
              background: var(--pill-bg);
              padding: 8px 14px;
              border-radius: 12px;
              margin-bottom: 22px;
              border: 1px solid rgba(148, 163, 184, 0.15);
            }
            .cs-dot {
              width: 8px;
              height: 8px;
              border-radius: 50%;
              background: #25D366;
              box-shadow: 0 0 8px #25D366;
            }
            .cs-name {
              font-size: 12px;
              font-weight: 700;
              color: var(--text-main);
            }

            /* WhatsApp Button */
            .btn-wa {
              display: flex;
              align-items: center;
              justify-content: center;
              gap: 8px;
              background: linear-gradient(135deg, #25D366 0%, #128C7E 100%);
              color: #FFFFFF;
              text-decoration: none;
              padding: 13px 20px;
              border-radius: 14px;
              font-size: 13.5px;
              font-weight: 700;
              box-shadow: 0 8px 20px rgba(37, 211, 102, 0.3);
              transition: all 0.2s ease;
              width: 100%;
            }
            .btn-wa:active {
              transform: scale(0.98);
            }

            .footer-note {
              font-size: 11px;
              color: var(--text-muted);
              margin-top: 14px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="card">
              <div class="progress-bar"></div>

              <div class="spinner-wrapper">
                <div class="ring-pulse"></div>
                <div class="spinner-ring"></div>
                <div class="icon-center">
                  <svg class="wa-icon" viewBox="0 0 24 24">
                    <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-5.46-4.45-9.92-9.91-9.92zM12.04 20.15c-1.48 0-2.93-.4-4.2-1.15l-.3-.18-3.12.82.83-3.04-.2-.31c-.82-1.31-1.26-2.83-1.26-4.38 0-4.54 3.7-8.24 8.25-8.24 4.54 0 8.24 3.7 8.24 8.24 0 4.54-3.7 8.24-8.24 8.24zm4.52-6.17c-.25-.12-1.47-.72-1.7-.81-.23-.08-.39-.12-.56.12-.17.25-.64.81-.79.97-.14.17-.29.19-.54.07-.25-.12-1.05-.39-2-1.23-.74-.66-1.24-1.47-1.38-1.72-.15-.25-.02-.38.11-.5.11-.11.25-.29.37-.43.12-.15.17-.25.25-.42.08-.17.04-.31-.02-.43s-.56-1.34-.76-1.84c-.2-.48-.41-.42-.56-.43h-.48c-.17 0-.43.06-.66.31-.22.25-.86.84-.86 2.05 0 1.21.88 2.38 1 2.55.13.17 1.74 2.65 4.21 3.72.59.25 1.05.41 1.41.52.59.19 1.13.16 1.56.1.48-.07 1.47-.6 1.68-1.18.21-.58.21-1.07.15-1.18-.07-.12-.23-.19-.48-.31z"/>
                  </svg>
                </div>
              </div>

              <h1>Menghubungkan ke WhatsApp</h1>
              <p class="subtitle">Sedang mengalihkan ke kontak Customer Service...</p>

              <div class="cs-pill">
                <span class="cs-dot"></span>
                <span class="cs-name">CS Bertugas: ${targetName}</span>
              </div>

              <a href="${waUrl}" class="btn-wa" id="waRedirectBtn">
                <span>Buka WhatsApp Sekarang</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M5 12h14"></path>
                  <path d="m12 5 7 7-7 7"></path>
                </svg>
              </a>

              <p class="footer-note">Jika tidak terbuka otomatis dalam 3 detik, klik tombol di atas.</p>
            </div>
          </div>

          <script>
            setTimeout(function() {
              window.location.href = "${waUrl}";
            }, 350);
          </script>
        </body>
        </html>
      `);

    } catch (err) {
      console.error('Redirect controller error:', err);
      const defaultFallback = process.env.DEFAULT_FALLBACK_NUMBER || '6281234567890';
      return res.redirect(302, `https://wa.me/${defaultFallback}`);
    }
  }
}

export default RedirectController;
