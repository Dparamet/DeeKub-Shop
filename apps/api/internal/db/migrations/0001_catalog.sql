CREATE TABLE products (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    slug text NOT NULL UNIQUE,
    game_title text NOT NULL,
    name text NOT NULL,
    product_type text NOT NULL CHECK (product_type IN ('TOPUP', 'GAME_KEY')),
    description text NOT NULL DEFAULT '',
    price_minor bigint NOT NULL CHECK (price_minor >= 0),
    currency text NOT NULL DEFAULT 'THB' CHECK (currency ~ '^[A-Z]{3}$'),
    platform text NOT NULL,
    region text NOT NULL,
    is_published boolean NOT NULL DEFAULT false,
    sort_order integer NOT NULL DEFAULT 0,
    metadata jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(metadata) = 'object'),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX products_public_catalog_idx
    ON products (product_type, sort_order, game_title, name)
    WHERE is_published = true;

INSERT INTO products (slug, game_title, name, product_type, description, price_minor, platform, region, is_published, sort_order, metadata)
VALUES
    ('valorant-475', 'VALORANT', '475 VP', 'TOPUP', 'คะแนน VP สำหรับบัญชี Riot Games', 15900, 'Riot Games', 'Asia Pacific', true, 10,
     '{"artwork":"valorant","account_fields":[{"id":"riot-id","label":"Riot ID","placeholder":"ชื่อในเกม"},{"id":"riot-tag","label":"Tag","placeholder":"เช่น TH1"}]}'::jsonb),
    ('rov-240', 'ROV', '240 Vouchers', 'TOPUP', 'แพ็กเกจเติมเกมสำหรับ Garena RoV', 10900, 'Garena', 'Thailand', true, 20,
     '{"artwork":"arena","account_fields":[{"id":"player-id","label":"Player ID","placeholder":"กรอก UID ผู้เล่น"},{"id":"server","label":"Server","placeholder":"กรอก Server ID"}]}'::jsonb),
    ('genshin-welkin', 'GENSHIN IMPACT', 'Blessing of the Welkin Moon', 'TOPUP', 'แพ็กเกจตัวอย่างสำหรับบัญชี HoYoverse', 14900, 'HoYoverse', 'เลือก Server ในฟอร์ม', true, 30,
     '{"artwork":"genshin","account_fields":[{"id":"uid","label":"UID","placeholder":"กรอก UID ผู้เล่น"},{"id":"server","label":"Server / Region","placeholder":"เช่น Asia"}]}'::jsonb),
    ('hades-ii-key', 'HADES II', 'Hades II', 'GAME_KEY', 'ตัวอย่างสินค้า Game Key สำหรับ Steam', 69000, 'Steam', 'Global', true, 40,
     '{"artwork":"hades"}'::jsonb),
    ('stardew-key', 'STARDEW VALLEY', 'Stardew Valley', 'GAME_KEY', 'ตัวอย่างสินค้า Game Key สำหรับ Steam', 31500, 'Steam', 'Global', true, 50,
     '{"artwork":"stardew"}'::jsonb),
    ('cyberpunk-key', 'CYBERPUNK 2077', 'Cyberpunk 2077', 'GAME_KEY', 'ตัวอย่างสินค้า Game Key สำหรับ Steam', 129000, 'Steam', 'Global', true, 60,
     '{"artwork":"cyberpunk"}'::jsonb)
ON CONFLICT (slug) DO NOTHING;
