-- Hapus toko multi-role lama, set seller@ untuk panel login demo
DELETE FROM products WHERE store_id IN (SELECT id FROM stores WHERE name = 'Toko Multi');
DELETE FROM stores WHERE name = 'Toko Multi';

UPDATE stores s SET provisioned_by = 'seed', demo_password = 'seller123'
FROM users u
WHERE s.seller_user_id = u.id AND u.email = 'seller@seapedia.com';
