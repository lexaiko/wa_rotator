import prisma from './config/prisma.js';
import bcrypt from 'bcryptjs';

async function main() {
  console.log('Seeding initial data for TripBanyuwangi WA Rotator...');

  // 0. Ensure Admin User exists
  const existingAdmin = await prisma.adminUser.findUnique({ where: { username: 'admin' } });
  if (!existingAdmin) {
    const passwordHash = await bcrypt.hash('admin123', 10);
    await prisma.adminUser.create({
      data: {
        username: 'admin',
        password_hash: passwordHash,
        name: 'Super Admin TripBwi',
        email: 'admin@tripbanyuwangi.com',
        role: 'SUPERADMIN'
      }
    });
    console.log('Created Default Super Admin: username="admin", password="admin123"');
  }

  // 1. Clear old rotator data
  await prisma.clickLog.deleteMany({});
  await prisma.campaignCS.deleteMany({});
  await prisma.campaign.deleteMany({});
  await prisma.cSAdmin.deleteMany({});

  // 2. Create CS Admins
  const csPutri = await prisma.cSAdmin.create({
    data: {
      name: 'CS Putri',
      phone_number: '6281234567890',
      email: 'putri@tripbanyuwangi.com',
      avatar_url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
      is_active: true,
      auto_schedule: true,
      schedule_start: '08:00',
      schedule_end: '17:00',
      enable_daily_cap: true,
      daily_lead_cap: 40,
      today_lead_count: 14
    }
  });

  const csBagus = await prisma.cSAdmin.create({
    data: {
      name: 'CS Bagus',
      phone_number: '6281234567891',
      email: 'bagus@tripbanyuwangi.com',
      avatar_url: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150&auto=format&fit=crop&q=80',
      is_active: true,
      auto_schedule: false,
      enable_daily_cap: true,
      daily_lead_cap: 50,
      today_lead_count: 22
    }
  });

  const csDina = await prisma.cSAdmin.create({
    data: {
      name: 'CS Dina',
      phone_number: '6281234567892',
      email: 'dina@tripbanyuwangi.com',
      avatar_url: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
      is_active: true,
      auto_schedule: true,
      schedule_start: '09:00',
      schedule_end: '18:00',
      enable_daily_cap: true,
      daily_lead_cap: 35,
      today_lead_count: 8
    }
  });

  const csRian = await prisma.cSAdmin.create({
    data: {
      name: 'CS Rian (Shift Malam)',
      phone_number: '6281234567893',
      email: 'rian@tripbanyuwangi.com',
      avatar_url: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80',
      is_active: true,
      auto_schedule: true,
      schedule_start: '17:00',
      schedule_end: '23:59',
      enable_daily_cap: false,
      daily_lead_cap: 0,
      today_lead_count: 5
    }
  });

  console.log('Created CS Admins: Putri, Bagus, Dina, Rian');

  // 3. Create Campaigns
  const campIjen = await prisma.campaign.create({
    data: {
      title: 'Paket Midnight Kawah Ijen Blue Fire',
      slug: 'kawah-ijen',
      description: 'Iklan Meta & TikTok khusus promo paket trip Blue Fire Kawah Ijen',
      rotation_mode: 'SMOOTH_WEIGHTED',
      message_template: 'Halo {nama_cs}, saya mau tanya info & booking promo Paket Midnight Kawah Ijen dari {channel}!',
      fallback_number: '6281234567890',
      redirect_mode: 'INTERSTITIAL',
      pixel_fb_id: '123456789012345',
      pixel_tiktok_id: 'C9876543210ABCDEF',
      is_active: true,
      sticky_session: true,
      sticky_duration_hours: 24,
      cs_assignments: {
        create: [
          { cs_id: csPutri.id, weight: 40, is_active: true },
          { cs_id: csBagus.id, weight: 30, is_active: true },
          { cs_id: csDina.id, weight: 30, is_active: true }
        ]
      }
    }
  });

  const campBaluran = await prisma.campaign.create({
    data: {
      title: 'Promo Safari Africa van Java Baluran',
      slug: 'baluran-safari',
      description: 'Campaign TikTok Ads untuk promo Taman Nasional Baluran & Pantai Bama',
      rotation_mode: 'SMOOTH_WEIGHTED',
      message_template: 'Halo {nama_cs}, saya tertarik dengan promo Trip Baluran Savana dari {channel}!',
      fallback_number: '6281234567891',
      redirect_mode: 'INTERSTITIAL',
      pixel_tiktok_id: 'C9876543210ABCDEF',
      is_active: true,
      cs_assignments: {
        create: [
          { cs_id: csBagus.id, weight: 50, is_active: true },
          { cs_id: csRian.id, weight: 50, is_active: true }
        ]
      }
    }
  });

  const campBio = await prisma.campaign.create({
    data: {
      title: 'Link Utama Bio Instagram @tripbanyuwangi',
      slug: 'ig-bio',
      description: 'Rotator umum untuk traffic organik dari profil Instagram',
      rotation_mode: 'SMOOTH_WEIGHTED',
      message_template: 'Halo {nama_cs}, {greeting}! Saya dari Instagram @tripbanyuwangi mau konsultasi liburan ke Banyuwangi.',
      fallback_number: '6281234567890',
      redirect_mode: 'DIRECT_302',
      is_active: true,
      cs_assignments: {
        create: [
          { cs_id: csPutri.id, weight: 30, is_active: true },
          { cs_id: csBagus.id, weight: 30, is_active: true },
          { cs_id: csDina.id, weight: 20, is_active: true },
          { cs_id: csRian.id, weight: 20, is_active: true }
        ]
      }
    }
  });

  console.log('Created Campaigns: kawah-ijen, baluran-safari, ig-bio');

  // 4. Generate Sample Realistic Click Logs (Past 7 Days)
  const channels = ['TikTok', 'Instagram', 'Facebook', 'Google', 'Direct'];
  const cities = [
    { city: 'Surabaya', province: 'Jawa Timur' },
    { city: 'Jakarta Selatan', province: 'DKI Jakarta' },
    { city: 'Malang', province: 'Jawa Timur' },
    { city: 'Bandung', province: 'Jawa Barat' },
    { city: 'Denpasar', province: 'Bali' },
    { city: 'Semarang', province: 'Jawa Tengah' },
    { city: 'Yogyakarta', province: 'DI Yogyakarta' },
    { city: 'Banyuwangi', province: 'Jawa Timur' }
  ];
  const devices = ['mobile', 'mobile', 'mobile', 'desktop', 'tablet'];
  const osList = ['Android', 'iOS', 'Windows', 'Android', 'iOS'];
  const browsers = ['Chrome', 'Mobile Safari', 'TikTok Browser', 'Instagram App', 'Chrome Mobile'];
  const csPool = [csPutri, csBagus, csDina, csRian];

  const logsToInsert = [];
  const now = Date.now();

  for (let i = 0; i < 95; i++) {
    // Spread across past 7 days
    const hoursAgo = Math.floor(Math.random() * (7 * 24));
    const logDate = new Date(now - hoursAgo * 3600 * 1000);
    const loc = cities[Math.floor(Math.random() * cities.length)];
    const channel = channels[Math.floor(Math.random() * channels.length)];
    const camp = i % 2 === 0 ? campIjen : (i % 3 === 0 ? campBaluran : campBio);
    const assignedCS = csPool[Math.floor(Math.random() * csPool.length)];

    logsToInsert.push({
      campaign_id: camp.id,
      cs_id: assignedCS.id,
      ip_address: `180.252.${Math.floor(Math.random() * 254)}.${Math.floor(Math.random() * 254)}`,
      user_agent: 'Mozilla/5.0 (Linux; Android 13; SM-G991B) AppleWebKit/537.36',
      device_type: devices[Math.floor(Math.random() * devices.length)],
      os: osList[Math.floor(Math.random() * osList.length)],
      browser: browsers[Math.floor(Math.random() * browsers.length)],
      country: 'Indonesia',
      province: loc.province,
      city: loc.city,
      referrer: channel === 'TikTok' ? 'https://www.tiktok.com/' : (channel === 'Instagram' ? 'https://l.instagram.com/' : null),
      utm_source: channel.toLowerCase(),
      utm_medium: channel === 'Direct' ? null : 'cpc',
      utm_campaign: camp.slug,
      redirect_url: `https://wa.me/${assignedCS.phone_number}?text=Halo`,
      created_at: logDate
    });
  }

  await prisma.clickLog.createMany({ data: logsToInsert });
  console.log(`Generated ${logsToInsert.length} realistic click logs.`);
  console.log('Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
