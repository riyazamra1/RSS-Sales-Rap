INSERT INTO public.products (name, sku, barcode, brand, model, category, unit, wholesale_price, sales_price, stock, min_stock, supplier, warranty, description) VALUES
('Hikvision 2MP ColorVu Bullet Camera','HIK-2CD1027','4895188123401','Hikvision','DS-2CD1027G0-L','CCTV Cameras','PCS',11500,14500,40,10,'Secure Vision Lanka','2 Years','2MP full-time colour IP bullet camera, 2.8mm lens, IP67'),
('Hikvision 4MP AcuSense Dome Camera','HIK-4CD2143','4895188123418','Hikvision','DS-2CD2143G2-I','CCTV Cameras','PCS',18500,23500,25,6,'Secure Vision Lanka','2 Years','4MP IR fixed dome IP camera with human/vehicle detection'),
('Dahua 5MP HDCVI Bullet Camera','DAH-HFW1500','6923172512345','Dahua','HAC-HFW1500TN','CCTV Cameras','PCS',7800,9900,50,12,'Dahua Distributors','2 Years','5MP HDCVI IR bullet camera, 3.6mm, metal housing'),
('Hikvision 8CH DVR 1080p','HIK-DVR8CH','4895188223402','Hikvision','DS-7208HGHI-K1','DVR / NVR','PCS',21500,26900,18,4,'Secure Vision Lanka','2 Years','8 channel Turbo HD DVR, H.265 Pro+, 1 SATA'),
('Hikvision 8CH PoE NVR 4K','HIK-NVR8P','4895188223419','Hikvision','DS-7608NI-K1/8P','DVR / NVR','PCS',42500,52000,10,3,'Secure Vision Lanka','2 Years','8 channel 4K NVR with 8 built-in PoE ports'),
('Seagate SkyHawk 2TB Surveillance HDD','SEA-SKY2TB','7636490078019','Seagate','ST2000VX017','Storage','PCS',18500,22500,30,8,'Tech Source Lanka','3 Years','2TB 3.5" surveillance-grade hard disk, 24/7 rated'),
('Seagate SkyHawk 4TB Surveillance HDD','SEA-SKY4TB','7636490078026','Seagate','ST4000VX016','Storage','PCS',31500,38500,15,4,'Tech Source Lanka','3 Years','4TB 3.5" surveillance-grade hard disk, 24/7 rated'),
('TP-Link 8-Port Gigabit PoE Switch','TPL-SG1008P','6935364052492','TP-Link','TL-SG1008P','Networking','PCS',12500,15900,22,6,'Netcom Lanka','3 Years','8 port gigabit desktop switch with 4 PoE+ ports, 55W'),
('TP-Link AC1200 Dual Band Router','TPL-C6','6935364088415','TP-Link','Archer C6','Networking','PCS',7200,9500,35,10,'Netcom Lanka','2 Years','AC1200 wireless dual band gigabit router, MU-MIMO'),
('Cat6 UTP Cable 305m Box','CBL-CAT6-305','9557001120014','D-Link','NCB-C6UGRYR-305','Cables & Accessories','BOX',24500,29500,12,3,'Netcom Lanka','No Warranty','Cat6 UTP solid copper LAN cable, 305m pull box, grey'),
('RG59 + Power Coaxial Cable 305m','CBL-RG59-305','9557001120021','Generic','RG59+2C','Cables & Accessories','BOX',16500,20500,14,4,'Cable Mart','No Warranty','RG59 CCTV coaxial cable with 2 core power, 305m roll'),
('BNC Connector Pack (100 pcs)','ACC-BNC100','9557001120038','Generic','BNC-CRIMP','Cables & Accessories','PKT',2200,3200,60,15,'Cable Mart','No Warranty','Crimp type BNC male connectors, pack of 100'),
('12V 5A CCTV Power Supply Box','ACC-PSU12V5A','9557001120045','Generic','PSU-12V5A','Power & UPS','PCS',3200,4500,45,12,'Power Line Traders','1 Year','12V 5A centralized CCTV power supply with 8 outputs'),
('APC 650VA Line Interactive UPS','APC-BX650','8901234567890','APC','BX650LI-MS','Power & UPS','PCS',18500,23000,16,4,'Power Line Traders','2 Years','650VA / 360W line interactive UPS with AVR'),
('Kingston 8GB DDR4 Desktop RAM','KST-8GDDR4','740617296068','Kingston','KVR26N19S8/8','Computer Hardware','PCS',9500,12500,28,8,'Tech Source Lanka','Lifetime','8GB DDR4 2666MHz non-ECC desktop memory module'),
('Kingston A400 480GB SATA SSD','KST-A400480','740617298017','Kingston','SA400S37/480G','Computer Hardware','PCS',12500,15900,26,8,'Tech Source Lanka','3 Years','480GB 2.5" SATA III solid state drive'),
('Logitech K120 USB Keyboard','LOG-K120','5099206021471','Logitech','K120','Accessories','PCS',3200,4400,40,10,'Tech Source Lanka','1 Year','Spill resistant USB wired keyboard'),
('Logitech B100 USB Mouse','LOG-B100','5099206041981','Logitech','B100','Accessories','PCS',1400,2100,55,15,'Tech Source Lanka','1 Year','Optical USB wired mouse, 800 dpi'),
('Hikvision 1MP Video Intercom Kit','HIK-DS-KIS204','4895188323403','Hikvision','DS-KIS204T','Intercom & Access','PCS',26500,33500,8,2,'Secure Vision Lanka','1 Year','Analogue video door phone kit with indoor monitor'),
('ZKTeco Fingerprint Access Controller','ZKT-K40','6936284412345','ZKTeco','K40','Intercom & Access','PCS',22500,28500,9,3,'Access Systems Lanka','1 Year','Fingerprint and RFID time attendance / access control unit')
ON CONFLICT (sku) DO NOTHING;

INSERT INTO public.product_costs (product_id, purchase_price)
SELECT id, round(wholesale_price * 0.88, 2) FROM public.products
ON CONFLICT (product_id) DO NOTHING;