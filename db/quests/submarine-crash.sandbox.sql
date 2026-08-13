-- «Крушение подлодки» — отдельная схема учебной песочницы.

CREATE SCHEMA IF NOT EXISTS submarine_crash;
SET search_path TO submarine_crash;

DROP TABLE IF EXISTS circuits;
DROP TABLE IF EXISTS pods_list;
DROP TABLE IF EXISTS evacuation_groups;
DROP TABLE IF EXISTS original_crew;
DROP TABLE IF EXISTS staffing_changes;
DROP TABLE IF EXISTS joined_crew;
DROP TABLE IF EXISTS depot_records;
DROP TABLE IF EXISTS phone_logs;
DROP TABLE IF EXISTS lift_malfunctions;
DROP TABLE IF EXISTS lift_locations_2;
DROP TABLE IF EXISTS lift_locations;
DROP TABLE IF EXISTS readings;
DROP TABLE IF EXISTS full_crew;
DROP TABLE IF EXISTS crew;
DROP TABLE IF EXISTS malfunctions;

CREATE TABLE malfunctions (
  issues_id integer PRIMARY KEY,
  issues    text NOT NULL,
  fix       text
);

INSERT INTO malfunctions (issues_id, issues, fix) VALUES
  (10, 'повреждены спасательные капсулы', NULL),
  (11, 'утечка на палубе 14', 'Активировать осушительный насос'),
  (12, 'утечка на палубе 15', 'Активировать осушительный насос'),
  (13, 'утечка на палубе 16', 'Активировать осушительный насос'),
  (14, 'двигатель отключён', 'Перенаправить питание'),
  (15, 'камеры отключены', 'Перенаправить питание'),
  (16, 'верхний переход затоплен', 'Активировать осушительный насос'),
  (17, 'нижний переход разрушен', NULL),
  (18, 'утечка кислорода', 'Герметизировать палубу 12');

CREATE TABLE crew (
    staff_name VARCHAR(100),
    staff_id VARCHAR(10),
    last_location VARCHAR(20),
    status VARCHAR(20),
    role VARCHAR(100)
);
INSERT INTO crew (
    staff_name,
    staff_id,
    last_location,
    status,
    role
) VALUES
    ('Nora Keaton', 'st456', 'deck 3', 'living', 'medical officer'),
    ('Renee Walker', 'yz345', 'deck 1', 'injured', 'communications technician'),
    ('Helen Mercer', 'cd901', 'deck 3', 'living', 'weapons technician'),
    ('Kate Warren', 'ij890', 'deck 1', 'injured', 'communications officer'),
    ('Claire Bennett', 'mn456', 'deck 3', 'living', 'engineering technician'),
    ('Haley Brooks', 'uv789', 'deck 2', 'deceased', 'weapons technician'),
    ('Naomi Carter', 'wx012', 'deck 3', 'living', 'engineering officer'),
    ('Sarah Johnson', 'ab123', 'deck 4', 'living', 'sonar operator'),
    ('James Smith', 'cd456', 'deck 2', 'injured', 'engineering officer'),
    ('Emily Williams', 'ef789', 'deck 3', 'deceased', 'navigation officer'),
    ('Ahmed Khan', 'kl678', 'deck 6', 'living', 'weapons officer'),
    ('Taro Yamada', 'mn901', 'deck 2', 'injured', 'communications officer'),
    ('Sofia Rodriguez', 'op234', 'deck 4', 'living', 'medical officer'),
    ('Wen Chang', 'qr567', 'deck 3', 'deceased', 'engineering technician'),
    ('Ali Bhai', 'st890', 'deck 5', 'injured', 'navigation technician'),
    ('Fatima Ahmed', 'uv012', 'deck 1', 'living', 'sonar technician'),
    ('Jung Lee', 'wx345', 'deck 2', 'deceased', 'communications technician'),
    ('Mason Irving', 'yz678', 'deck 4', 'living', 'medical technician'),
    ('Karen Williams', 'ab901', 'deck 5', 'injured', 'weapons technician'),
    ('Vikram Singh', 'cd234', 'deck 1', 'living', 'engineering officer'),
    ('Samantha Taylor', 'ef567', 'deck 2', 'deceased', 'navigation officer'),
    ('Kimberly Johnson', 'gh890', 'deck 3', 'living', 'communications officer'),
    ('Jason Smith', 'ij123', 'deck 4', 'injured', 'medical officer'),
    ('Sofia Patel', 'kl012', 'deck 7', 'living', 'engineering technician'),
    ('Jasmine Kim', 'mn456', 'deck 5', 'injured', 'navigation technician'),
    ('Javier Hernandez', 'op789', 'deck 3', 'deceased', 'communications technician'),
    ('Linda Nguyen', 'qr123', 'deck 8', 'living', 'medical technician'),
    ('Mohammed Ali', 'st456', 'deck 2', 'injured', 'weapons technician'),
    ('Hailey Williams', 'uv789', 'deck 4', 'living', 'engineering officer'),
    ('Abigail Lee', 'wx012', 'deck 1', 'deceased', 'navigation officer'),
    ('Nina Rodriguez', 'yz345', 'deck 12', 'deceased', 'communications officer'),
    ('Derek Johnson', 'ab678', 'deck 7', 'living', 'medical officer'),
    ('Emma Smith', 'cd901', 'deck 5', 'injured', 'engineering technician'),
    ('Michael Williams', 'ef234', 'deck 3', 'deceased', 'navigation technician'),
    ('Ryan Singh', 'ij890', 'deck 2', 'injured', 'medical technician'),
    ('Evelyn Lee', 'kl123', 'deck 1', 'living', 'weapons technician'),
    ('William Johnson', 'mn456', 'deck 6', 'injured', 'engineering officer'),
    ('Jessica Williams', 'op789', 'deck 3', 'deceased', 'navigation officer'),
    ('Samuel Kim', 'qr123', 'deck 5', 'living', 'communications officer'),
    ('Laura Rodriguez', 'st456', 'deck 1', 'injured', 'medical officer'),
    ('David Nguyen', 'uv789', 'deck 2', 'deceased', 'engineering technician'),
    ('Maria Hernandez', 'wx012', 'deck 4', 'living', 'navigation technician'),
    ('James Patel', 'yz345', 'deck 3', 'injured', 'communications technician'),
    ('Olivia Taylor', 'ab678', 'deck 7', 'living', 'medical technician'),
    ('Noah Singh', 'cd901', 'deck 5', 'injured', 'weapons technician'),
    ('Emily Kim', 'ef234', 'deck 2', 'deceased', 'engineering officer'),
    ('Chloe Williams', 'gh567', 'deck 3', 'living', 'navigation officer'),
    ('Mia Johnson', 'ij890', 'deck 4', 'injured', 'communications officer'),
    ('Jacob Rodriguez', 'kl123', 'deck 5', 'living', 'medical officer'),
    ('Sophia Patel', 'mn456', 'deck 1', 'injured', 'engineering technician'),
    ('Michael Lee', 'op789', 'deck 2', 'deceased', 'navigation technician'),
    ('Sarah Kim', 'qr123', 'deck 3', 'living', 'communications technician'),
    ('Ava Rodriguez', 'uv789', 'deck 5', 'living', 'weapons technician'),
    ('Matthew Taylor', 'wx012', 'deck 1', 'injured', 'engineering officer'),
    ('Lily Patel', 'yz345', 'deck 2', 'deceased', 'navigation officer'),
    ('Ethan Singh', 'ab678', 'deck 3', 'living', 'communications officer'),
    ('Natalie Kim', 'cd901', 'deck 4', 'injured', 'medical officer'),
    ('Abigail Williams', 'ef234', 'deck 5', 'living', 'engineering technician'),
    ('Logan Johnson', 'gh567', 'deck 1', 'injured', 'navigation technician'),
    ('Sofia Kim', 'kl123', 'deck 3', 'living', 'medical technician'),
    ('Owen Williams', 'op789', 'deck 5', 'living', 'engineering officer'),
    ('Avery Johnson', 'qr123', 'deck 1', 'injured', 'navigation officer'),
    ('Ella Rodriguez', 'st456', 'deck 2', 'deceased', 'communications officer'),
    ('Liam Singh', 'uv789', 'deck 3', 'living', 'medical officer'),
    ('Olivia Kim', 'yz345', 'deck 5', 'living', 'navigation technician'),
    ('William Taylor', 'ab678', 'deck 1', 'injured', 'communications technician'),
    ('Ava Williams', 'cd901', 'deck 2', 'deceased', 'medical technician'),
    ('Mia Rodriguez', 'ef234', 'deck 3', 'living', 'weapons technician'),
    ('Lucas Johnson', 'gh567', 'deck 4', 'injured', 'engineering officer'),
    ('Sophia Kim', 'ij890', 'deck 5', 'living', 'navigation officer'),
    ('Noah Williams', 'kl123', 'deck 1', 'injured', 'communications officer'),
    ('Emily Rodriguez', 'mn456', 'deck 2', 'deceased', 'medical officer'),
    ('Chloe Johnson', 'op789', 'deck 3', 'living', 'engineering technician'),
    ('Mia Patel', 'qr123', 'deck 4', 'injured', 'navigation technician'),
    ('Jacob Kim', 'st456', 'deck 5', 'living', 'communications technician'),
    ('Sophia Williams', 'uv789', 'deck 1', 'injured', 'medical technician'),
    ('Michael Rodriguez', 'wx012', 'deck 2', 'deceased', 'weapons technician'),
    ('Benjamin Patel', 'ab678', 'deck 4', 'injured', 'navigation officer'),
    ('Ava Kim', 'cd901', 'deck 5', 'living', 'communications officer'),
    ('Matthew Rodriguez', 'ef234', 'deck 1', 'injured', 'medical officer'),
    ('Lily Williams', 'gh567', 'deck 2', 'deceased', 'engineering technician'),
    ('Ethan Johnson', 'ij890', 'deck 3', 'living', 'navigation technician'),
    ('Natalie Patel', 'kl123', 'deck 4', 'injured', 'communications technician'),
    ('Abigail Kim', 'mn456', 'deck 5', 'living', 'medical technician'),
    ('Logan Rodriguez', 'op789', 'deck 1', 'injured', 'weapons technician'),
    ('Mila Williams', 'qr123', 'deck 2', 'deceased', 'engineering officer'),
    ('James Johnson', 'st456', 'deck 3', 'living', 'navigation officer'),
    ('Hannah Patel', 'uv789', 'deck 4', 'injured', 'communications officer'),
    ('Owen Kim', 'wx012', 'deck 5', 'living', 'medical officer'),
    ('Avery Rodriguez', 'yz345', 'deck 1', 'injured', 'engineering technician'),
    ('Ella Williams', 'ab678', 'deck 2', 'deceased', 'navigation technician'),
    ('Liam Johnson', 'cd901', 'deck 3', 'living', 'communications technician'),
    ('Emma Patel', 'ef234', 'deck 4', 'injured', 'medical technician'),
    ('William Rodriguez', 'ij890', 'deck 1', 'injured', 'engineering officer'),
    ('Mia Kim', 'mn456', 'deck 3', 'living', 'communications officer'),
    ('Lucas Rodriguez', 'op789', 'deck 4', 'injured', 'medical officer'),
    ('Sofia Johnson', 'qr123', 'deck 5', 'living', 'engineering technician'),
    ('Michael Patel', 'st456', 'deck 1', 'injured', 'navigation technician'),
    ('Benjamin Williams', 'wx012', 'deck 3', 'living', 'medical technician'),

    ('Helena Sinclair', 'wt332', 'deck 15', 'living', 'first officer'),
    ('Matthew Williams', 'ab678', 'deck 5', 'living', 'engineering officer'),
    ('Lily Kim', 'cd901', 'deck 1', 'injured', 'navigation officer'),
    ('Ethan Rodriguez', 'ef234', 'deck 2', 'deceased', 'communications officer'),
    ('Natalie Johnson', 'gh567', 'deck 3', 'living', 'medical officer'),
    ('Abigail Patel', 'ij890', 'deck 4', 'injured', 'engineering technician'),
    ('Logan Kim', 'kl123', 'deck 5', 'living', 'navigation technician'),
    ('James Williams', 'op789', 'deck 2', 'deceased', 'medical technician'),
    ('Hannah Johnson', 'qr123', 'deck 3', 'living', 'weapons technician'),
    ('Owen Patel', 'st456', 'deck 4', 'injured', 'engineering officer'),
    ('Avery Kim', 'uv789', 'deck 5', 'living', 'navigation officer'),
    ('Liam Williams', 'yz345', 'deck 2', 'deceased', 'medical officer'),
    ('Emma Johnson', 'ab678', 'deck 3', 'living', 'engineering technician'),
    ('Olivia Patel', 'cd901', 'deck 4', 'injured', 'navigation technician'),

    ('Sandra Cole', 'ab678', 'deck 5', 'living', 'communications officer'),
    ('Meryl Stone', 'ef234', 'deck 2', 'deceased', 'engineering technician'),
    ('Judith Dane', 'gh567', 'deck 3', 'living', 'navigation technician'),
    ('Kate Beckett', 'kl123', 'deck 5', 'living', 'medical technician'),
    ('Gwen Palmer', 'op789', 'deck 2', 'deceased', 'engineering officer'),
    ('Charlotte Turner', 'qr123', 'deck 3', 'living', 'navigation officer'),

    ('Martin ''Marty'' Michaels', 'st456', 'deck 15', 'living', 'chief of the boat'),
    ('Matthew ''Matt'' Kowalski', 'st457', 'deck 6', 'living', 'navigator'),
    ('Stanley ''Stan'' Adams', 'st458', 'deck 8', 'living', 'sonar operator'),
    ('William ''Will'' Shaw', 'st459', 'deck 9', 'injured', 'communications officer'),
    ('Samuel ''Sam'' Mendes', 'st460', 'deck 13', 'living', 'weapons officer'),
    ('Adam ''Ace'' Levoy', 'st461', 'deck 12', 'deceased', 'engineering officer'),
    ('Nathan ''Nate'' Hodge', 'st462', 'deck 14', 'living', 'medical officer'),
    ('Liam ''Lee'' O''Connor', 'st463', 'deck 11', 'living', 'supply officer'),
    ('Benjamin ''Ben'' Grey', 'st464', 'deck 10', 'living', 'xo'),
    ('Oliver ''Ollie'' Banks', 'st465', 'deck 15', 'living', 'navigator'),
    ('Charles ''Charlie'' Watson', 'st466', 'deck 8', 'living', 'sonar operator'),
    ('Henry ''Hank'' Scott', 'st467', 'deck 9', 'injured', 'communications officer'),
    ('Michael ''Mike'' Reed', 'st468', 'deck 13', 'living', 'weapons officer'),
    ('Daniel ''Dan'' Cole', 'st469', 'deck 12', 'deceased', 'engineering officer'),
    ('Christopher ''Chris'' Campbell', 'st470', 'deck 14', 'living', 'medical officer'),
    ('Andrew ''Andy'' Kelly', 'st471', 'deck 11', 'living', 'supply officer'),
    ('David ''Dave'' Rogers', 'st472', 'deck 10', 'living', 'xo'),
    ('Edward ''Eddie'' Jones', 'st473', 'deck 15', 'living', 'navigator'),
    ('Frank ''Frankie'' Baker', 'st474', 'deck 8', 'living', 'sonar operator'),
    ('George Davis', 'st475', 'deck 9', 'injured', 'communications officer'),
    ('Harry Evans', 'st476', 'deck 13', 'living', 'weapons officer'),
    ('Isaac ''Ike'' Fisher', 'st477', 'deck 12', 'deceased', 'engineering officer'),
    ('Jacob ''Jake'' Green', 'st478', 'deck 14', 'living', 'medical officer'),
    ('Kevin ''Kev'' Baker', 'st479', 'deck 11', 'living', 'supply officer'),
    ('Louis ''Lou'' Campbell', 'st480', 'deck 10', 'living', 'xo'),
    ('Mark ''Marky'' Reed', 'st481', 'deck 15', 'living', 'navigator'),
    ('Nicholas ''Nick'' Davis', 'st482', 'deck 8', 'living', 'sonar operator'),
    ('Oliver ''Ollie'' Jones', 'st483', 'deck 9', 'injured', 'communications officer'),
    ('Quentin ''Q'' Cole', 'st485', 'deck 12', 'deceased', 'engineering officer'),
    ('Richard ''Rich'' Fisher', 'st486', 'deck 14', 'living', 'medical officer'),
    ('Steven ''Steve'' Grey', 'st487', 'deck 11', 'living', 'supply officer'),
    ('Thomas ''Tom'' Hodge', 'st488', 'deck 10', 'living', 'xo'),
    ('Ulysses ''Uly'' Kelly', 'st489', 'deck 15', 'living', 'navigator'),
    ('Vincent ''Vinny'' Levoy', 'st490', 'deck 8', 'living', 'sonar operator'),
    ('Walter ''Wally'' Michaels', 'st491', 'deck 9', 'injured', 'communications officer'),
    ('Xavier ''Xav'' Mendes', 'st492', 'deck 13', 'living', 'weapons officer'),
    ('Yuri O''Connor', 'st493', 'deck 12', 'deceased', 'engineering officer'),
    ('Zachary ''Zach'' Reed', 'st494', 'deck 14', 'living', 'medical officer'),
    ('Adam ''Ace'' Cole', 'st495', 'deck 11', 'living', 'supply officer'),
    ('Benjamin ''Ben'' Davis', 'st496', 'deck 10', 'living', 'xo'),
    ('Christopher ''Chris'' Evans', 'st497', 'deck 15', 'living', 'navigator'),
    ('Daniel ''Dan'' Fisher', 'st498', 'deck 8', 'living', 'sonar operator'),
    ('Edward ''Eddie'' Green', 'st499', 'deck 9', 'injured', 'communications officer'),
    ('Frank ''Frankie'' Hodge', 'st500', 'deck 13', 'living', 'weapons officer'),
    ('George Jones', 'st501', 'deck 12', 'deceased', 'engineering officer'),
    ('Henry ''Hank'' Kelly', 'st502', 'deck 14', 'living', 'medical officer'),
    ('Isaac ''Ike'' Levoy', 'st503', 'deck 11', 'living', 'supply officer'),
    ('Jacob ''Jake'' Michaels', 'st504', 'deck 10', 'living', 'xo'),
    ('Kevin ''Kev'' Mendes', 'st505', 'deck 15', 'living', 'navigator'),
    ('Louis ''Lou'' O''Connor', 'st506', 'deck 8', 'living', 'sonar operator'),
    ('Nicholas ''Nick'' Scott', 'st508', 'deck 13', 'living', 'weapons officer'),
    ('Oliver ''Ollie'' Watson', 'st509', 'deck 12', 'deceased', 'engineering officer'),
    ('Patrick ''Pat'' Baker', 'st510', 'deck 14', 'living', 'medical officer'),
    ('Quentin ''Q'' Campbell', 'st511', 'deck 11', 'living', 'supply officer'),
    ('Richard ''Rich'' Davis', 'st512', 'deck 10', 'living', 'xo'),
    ('Steven ''Steve'' Evans', 'st513', 'deck 15', 'living', 'navigator'),
    ('Thomas ''Tom'' Fisher', 'st514', 'deck 8', 'living', 'sonar operator'),
    ('Ulysses ''Uly'' Green', 'st515', 'deck 9', 'injured', 'communications officer'),
    ('Vincent ''Vinny'' Hodge', 'st516', 'deck 13', 'living', 'weapons officer'),
    ('Walter ''Wally'' Jones', 'st517', 'deck 12', 'deceased', 'engineering officer'),
    ('Xavier ''Xav'' Kelly', 'st518', 'deck 14', 'living', 'medical officer'),
    ('Yuri Levoy', 'st519', 'deck 11', 'living', 'supply officer'),
    ('Zachary ''Zach'' Michaels', 'st520', 'deck 10', 'living', 'xo'),
    ('Adam ''Ace'' Mendes', 'st521', 'deck 15', 'living', 'navigator'),
    ('Benjamin ''Ben'' O''Connor', 'st522', 'deck 8', 'living', 'sonar operator'),
    ('Christopher ''Chris'' Reed', 'st523', 'deck 9', 'injured', 'communications officer'),
    ('Daniel ''Dan'' Scott', 'st524', 'deck 13', 'living', 'weapons officer');

ALTER TABLE crew
    ADD COLUMN weight_kg NUMERIC(5,1),
    ADD COLUMN pod_group VARCHAR(20),
    ADD COLUMN distance_to_pod INTEGER;

UPDATE crew AS c
SET weight_kg = source.weight_kg,
    pod_group = source.pod_group,
    distance_to_pod = source.distance_to_pod
FROM (VALUES
    ('Nora Keaton', 93, 'pd12 group 1', 112),
    ('Renee Walker', 67, 'pd12 group 2', 87),
    ('Helen Mercer', 92, 'pd12 group 0', 217),
    ('Kate Warren', 94, 'pd11 group 2', 132),
    ('Claire Bennett', 83, 'pd10 group 0', 3),
    ('Haley Brooks', 95, 'pd12 group 2', 264),
    ('Naomi Carter', 98, 'pd10 group 3', 154),
    ('Sarah Johnson', 58, 'pd12 group 2', 21),
    ('James Smith', 80, 'pd05 group 2', 290),
    ('Emily Williams', 67, 'pd05 group 0', 281),
    ('Ahmed Khan', 71, 'pd12 group 3', 190),
    ('Taro Yamada', 70, 'pd11 group 2', 246),
    ('Sofia Rodriguez', 72, 'pd10 group 1', 320),
    ('Wen Chang', 69, 'pd05 group 2', 127),
    ('Ali Bhai', 87, 'pd12 group 0', 175),
    ('Fatima Ahmed', 99, 'pd11 group 0', 95),
    ('Jung Lee', 76, 'pd11 group 3', 198),
    ('Mason Irving', 77, 'pd11 group 2', 318),
    ('Karen Williams', 85, 'pd10 group 3', 39),
    ('Vikram Singh', 57, 'pd12 group 3', 68),
    ('Samantha Taylor', 63, 'pd10 group 1', 142),
    ('Kimberly Johnson', 88, 'pd11 group 0', 150),
    ('Jason Smith', 72, 'pd12 group 2', 58),
    ('Sofia Patel', 80, 'pd12 group 2', 143),
    ('Jasmine Kim', 78, 'pd11 group 1', 324),
    ('Javier Hernandez', 52, 'pd05 group 3', 152),
    ('Linda Nguyen', 74, 'pd12 group 3', 161),
    ('Mohammed Ali', 81, 'pd10 group 0', 21),
    ('Hailey Williams', 88, 'pd05 group 2', 285),
    ('Abigail Lee', 54, 'pd05 group 1', 26),
    ('Nina Rodriguez', 94, 'pd11 group 1', 303),
    ('Derek Johnson', 97, 'pd10 group 0', 298),
    ('Emma Smith', 76, 'pd12 group 0', 25),
    ('Michael Williams', 95, 'pd11 group 3', 241),
    ('Ryan Singh', 83, 'pd11 group 3', 275),
    ('Evelyn Lee', 95, 'pd10 group 2', 104),
    ('William Johnson', 85, 'pd10 group 2', 14),
    ('Jessica Williams', 56, 'pd10 group 1', 73),
    ('Samuel Kim', 61, 'pd05 group 0', 33),
    ('Laura Rodriguez', 88, 'pd10 group 1', 38),
    ('David Nguyen', 94, 'pd12 group 0', 241),
    ('Maria Hernandez', 78, 'pd05 group 3', 58),
    ('James Patel', 76, 'pd11 group 1', 91),
    ('Olivia Taylor', 56, 'pd12 group 0', 30),
    ('Noah Singh', 89, 'pd11 group 1', 265),
    ('Emily Kim', 54, 'pd11 group 1', 242),
    ('Chloe Williams', 79, 'pd12 group 0', 228),
    ('Mia Johnson', 89, 'pd12 group 2', 244),
    ('Jacob Rodriguez', 76, 'pd12 group 1', 131),
    ('Sophia Patel', 76, 'pd10 group 0', 271),
    ('Michael Lee', 65, 'pd05 group 1', 206),
    ('Sarah Kim', 57, 'pd05 group 2', 39),
    ('Ava Rodriguez', 69, 'pd12 group 2', 165),
    ('Matthew Taylor', 88, 'pd05 group 3', 289),
    ('Lily Patel', 97, 'pd11 group 3', 19),
    ('Ethan Singh', 99, 'pd10 group 0', 171),
    ('Natalie Kim', 80, 'pd10 group 3', 84),
    ('Abigail Williams', 66, 'pd11 group 3', 177),
    ('Logan Johnson', 98, 'pd12 group 2', 299),
    ('Sofia Kim', 62, 'pd10 group 0', 335),
    ('Owen Williams', 65, 'pd12 group 2', 98),
    ('Avery Johnson', 83, 'pd11 group 1', 288),
    ('Ella Rodriguez', 69, 'pd10 group 2', 268),
    ('Liam Singh', 84, 'pd11 group 2', 5),
    ('Olivia Kim', 83, 'pd11 group 2', 304),
    ('William Taylor', 96, 'pd11 group 3', 116),
    ('Ava Williams', 59, 'pd11 group 1', 138),
    ('Mia Rodriguez', 61, 'pd12 group 2', 6),
    ('Lucas Johnson', 99, 'pd10 group 1', 208),
    ('Sophia Kim', 76, 'pd05 group 1', 2),
    ('Noah Williams', 88, 'pd11 group 0', 260),
    ('Emily Rodriguez', 73, 'pd12 group 1', 341),
    ('Chloe Johnson', 68, 'pd12 group 0', 335),
    ('Mia Patel', 91, 'pd05 group 3', 26),
    ('Jacob Kim', 52, 'pd12 group 3', 79),
    ('Sophia Williams', 99, 'pd10 group 0', 296),
    ('Michael Rodriguez', 77, 'pd10 group 0', 161),
    ('Benjamin Patel', 84, 'pd10 group 2', 90),
    ('Ava Kim', 84, 'pd10 group 2', 227),
    ('Matthew Rodriguez', 92, 'pd11 group 2', 69),
    ('Lily Williams', 86, 'pd11 group 0', 323),
    ('Ethan Johnson', 59, 'pd05 group 0', 13),
    ('Natalie Patel', 71, 'pd10 group 3', 133),
    ('Abigail Kim', 84, 'pd05 group 2', 70),
    ('Logan Rodriguez', 96, 'pd12 group 1', 271),
    ('Mila Williams', 55, 'pd12 group 0', 211),
    ('James Johnson', 86, 'pd12 group 1', 261),
    ('Hannah Patel', 50, 'pd10 group 3', 349),
    ('Owen Kim', 58, 'pd05 group 1', 239),
    ('Avery Rodriguez', 75, 'pd12 group 1', 240),
    ('Ella Williams', 56, 'pd10 group 1', 106),
    ('Liam Johnson', 98, 'pd11 group 1', 271),
    ('Emma Patel', 53, 'pd10 group 1', 158),
    ('William Rodriguez', 88, 'pd11 group 2', 169),
    ('Mia Kim', 62, 'pd10 group 3', 103),
    ('Lucas Rodriguez', 69, 'pd11 group 1', 311),
    ('Sofia Johnson', 53, 'pd12 group 1', 169),
    ('Michael Patel', 5, 'pd05 group 0', 179),
    ('Benjamin Williams', 94, 'pd10 group 2', 315),
    ('Helena Sinclair', 83, 'pd11 group 2', 170),
    ('Matthew Williams', 86, 'pd05 group 0', 314),
    ('Lily Kim', 76, 'pd05 group 3', 243),
    ('Ethan Rodriguez', 57, 'pd12 group 1', 218),
    ('Natalie Johnson', 94, 'pd11 group 0', 24),
    ('Abigail Patel', 6, 'pd05 group 3', 124),
    ('Logan Kim', 8, 'pd12 group 2', 218),
    ('James Williams', 52, 'pd11 group 3', 332),
    ('Hannah Johnson', 96, 'pd12 group 3', 293),
    ('Owen Patel', 63, 'pd10 group 0', 236),
    ('Avery Kim', 56, 'pd11 group 3', 53),
    ('Liam Williams', 63, 'pd12 group 3', 222),
    ('Emma Johnson', 78, 'pd12 group 0', 311),
    ('Olivia Patel', 57, 'pd05 group 3', 291),
    ('Sandra Cole', 9, 'pd10 group 3', 165),
    ('Meryl Stone', 56, 'pd05 group 3', 181),
    ('Judith Dane', 88, 'pd12 group 2', 262),
    ('Kate Beckett', 60, 'pd12 group 3', 142),
    ('Gwen Palmer', 7, 'pd12 group 0', 20),
    ('Charlotte Turner', 88, 'pd10 group 2', 312),
    ('Martin ''Marty'' Michaels', 8, 'pd12 group 0', 88),
    ('Matthew ''Matt'' Kowalski', 53, 'pd12 group 0', 148),
    ('Stanley ''Stan'' Adams', 55, 'pd12 group 0', 17),
    ('William ''Will'' Shaw', 79, 'pd05 group 2', 237),
    ('Samuel ''Sam'' Mendes', 7, 'pd12 group 2', 85),
    ('Adam ''Ace'' Levoy', 77, 'pd12 group 3', 171),
    ('Nathan ''Nate'' Hodge', 72, 'pd11 group 1', 13),
    ('Liam ''Lee'' O''Connor', 57, 'pd10 group 1', 137),
    ('Benjamin ''Ben'' Grey', 7.5, 'pd10 group 0', 175),
    ('Oliver ''Ollie'' Banks', 67, 'pd10 group 3', 104),
    ('Charles ''Charlie'' Watson', 52, 'pd12 group 3', 179),
    ('Henry ''Hank'' Scott', 85, 'pd05 group 0', 65),
    ('Michael ''Mike'' Reed', 93, 'pd10 group 2', 136),
    ('Daniel ''Dan'' Cole', 89, 'pd10 group 1', 320),
    ('Christopher ''Chris'' Campbell', 91, 'pd05 group 0', 272),
    ('Andrew ''Andy'' Kelly', 7.3, 'pd11 group 3', 45),
    ('David ''Dave'' Rogers', 8.1, 'pd11 group 3', 312),
    ('Edward ''Eddie'' Jones', 76, 'pd11 group 1', 325),
    ('Frank ''Frankie'' Baker', 8.2, 'pd10 group 0', 241),
    ('George Davis', 8, 'pd12 group 2', 53),
    ('Harry Evans', 91, 'pd05 group 2', 198),
    ('Isaac ''Ike'' Fisher', 93, 'pd12 group 3', 152),
    ('Jacob ''Jake'' Green', 50, 'pd10 group 1', 108),
    ('Kevin ''Kev'' Baker', 79, 'pd10 group 1', 301),
    ('Louis ''Lou'' Campbell', 98, 'pd12 group 1', 325),
    ('Mark ''Marky'' Reed', 85, 'pd11 group 3', 64),
    ('Nicholas ''Nick'' Davis', 68, 'pd05 group 1', 345),
    ('Oliver ''Ollie'' Jones', 6, 'pd05 group 1', 109),
    ('Quentin ''Q'' Cole', 54, 'pd05 group 0', 214),
    ('Richard ''Rich'' Fisher', 54, 'pd12 group 3', 112),
    ('Steven ''Steve'' Grey', 58, 'pd11 group 0', 220),
    ('Thomas ''Tom'' Hodge', 52, 'pd12 group 0', 228),
    ('Ulysses ''Uly'' Kelly', 53, 'pd12 group 1', 135),
    ('Vincent ''Vinny'' Levoy', 7.6, 'pd12 group 2', 83),
    ('Walter ''Wally'' Michaels', 7.3, 'pd12 group 1', 228),
    ('Xavier ''Xav'' Mendes', 75, 'pd11 group 0', 160),
    ('Yuri O''Connor', 78, 'pd11 group 2', 232),
    ('Zachary ''Zach'' Reed', 83, 'pd11 group 0', 59),
    ('Adam ''Ace'' Cole', 90, 'pd12 group 2', 262),
    ('Benjamin ''Ben'' Davis', 57, 'pd12 group 0', 328),
    ('Christopher ''Chris'' Evans', 7, 'pd12 group 1', 132),
    ('Daniel ''Dan'' Fisher', 58, 'pd10 group 0', 86),
    ('Edward ''Eddie'' Green', 90, 'pd11 group 0', 112),
    ('Frank ''Frankie'' Hodge', 69, 'pd05 group 0', 3),
    ('George Jones', 63, 'pd12 group 2', 33),
    ('Henry ''Hank'' Kelly', 72, 'pd12 group 1', 295),
    ('Isaac ''Ike'' Levoy', 85, 'pd11 group 1', 244),
    ('Jacob ''Jake'' Michaels', 80, 'pd05 group 3', 314),
    ('Kevin ''Kev'' Mendes', 77, 'pd10 group 3', 164),
    ('Louis ''Lou'' O''Connor', 91, 'pd12 group 2', 87),
    ('Nicholas ''Nick'' Scott', 72, 'pd12 group 0', 5),
    ('Oliver ''Ollie'' Watson', 70, 'pd12 group 3', 23),
    ('Patrick ''Pat'' Baker', 71, 'pd10 group 0', 273),
    ('Quentin ''Q'' Campbell', 99, 'pd05 group 0', 168),
    ('Richard ''Rich'' Davis', 90, 'pd10 group 0', 313),
    ('Steven ''Steve'' Evans', 67, 'pd12 group 3', 277),
    ('Thomas ''Tom'' Fisher', 85, 'pd12 group 0', 321),
    ('Ulysses ''Uly'' Green', 75, 'pd10 group 3', 335),
    ('Vincent ''Vinny'' Hodge', 63, 'pd10 group 2', 87),
    ('Walter ''Wally'' Jones', 53, 'pd11 group 3', 124),
    ('Xavier ''Xav'' Kelly', 98, 'pd12 group 2', 73),
    ('Yuri Levoy', 50, 'pd05 group 3', 235),
    ('Zachary ''Zach'' Michaels', 87, 'pd10 group 0', 196),
    ('Adam ''Ace'' Mendes', 93, 'pd10 group 2', 19),
    ('Benjamin ''Ben'' O''Connor', 8, 'pd05 group 0', 78),
    ('Christopher ''Chris'' Reed', 58, 'pd10 group 0', 13),
    ('Daniel ''Dan'' Scott', 7, 'pd10 group 2', 225)
) AS source(staff_name, weight_kg, pod_group, distance_to_pod)
WHERE source.staff_name = c.staff_name;

ALTER TABLE crew
    ALTER COLUMN weight_kg SET NOT NULL,
    ALTER COLUMN pod_group SET NOT NULL,
    ALTER COLUMN distance_to_pod SET NOT NULL;

CREATE TABLE evacuation_groups (
    pod_group VARCHAR(20) PRIMARY KEY,
    party_status VARCHAR(20) NOT NULL
);

INSERT INTO evacuation_groups (pod_group, party_status) VALUES
    ('pd12 group 1', 'boarded'),
    ('pd12 group 2', 'boarded'),
    ('pd12 group 0', 'boarded'),
    ('pd11 group 2', 'not boarded'),
    ('pd10 group 0', 'boarded'),
    ('pd10 group 3', 'boarded'),
    ('pd05 group 2', 'boarded'),
    ('pd05 group 0', 'boarded'),
    ('pd12 group 3', 'boarded'),
    ('pd10 group 1', 'boarded'),
    ('pd11 group 0', 'boarded'),
    ('pd11 group 3', 'boarded'),
    ('pd11 group 1', 'boarded'),
    ('pd05 group 3', 'boarded'),
    ('pd05 group 1', 'boarded'),
    ('pd10 group 2', 'boarded');

CREATE TABLE original_crew (
    staff_name VARCHAR(100) NOT NULL,
    staff_id VARCHAR(10) NOT NULL
);

INSERT INTO original_crew (staff_name, staff_id)
SELECT staff_name, staff_id
FROM crew;

INSERT INTO original_crew (staff_name, staff_id) VALUES
    ('Bruce Wiggum', 'mv652'),
    ('Vince Maverick', 'ru554'),
    ('Logan Trotsky', 'ma322'),
    ('Caitlin Truss', 'ca487'),
    ('Mark Manson', 'mm833');

CREATE TABLE full_crew AS
SELECT
    original_crew.staff_name,
    original_crew.staff_id,
    crew.last_location,
    crew.status,
    crew.role
FROM original_crew
LEFT JOIN crew
    ON original_crew.staff_id = crew.staff_id;

CREATE TABLE staffing_changes (
    staff_name VARCHAR(100) NOT NULL,
    role VARCHAR(100) NOT NULL,
    change_order INTEGER NOT NULL
);

INSERT INTO staffing_changes (staff_name, role, change_order) VALUES
    ('Bruce Wiggum', 'Seaman Recruit', 1),
    ('Bruce Wiggum', 'Injured', 2),
    ('Bruce Wiggum', 'Medical Leave', 3),
    ('Bruce Wiggum', 'Returned', 4),
    ('Bruce Wiggum', 'Radioman', 5),
    ('Vince Maverick', 'Navigation Officer', 1),
    ('Vince Maverick', 'Transfer', 2),
    ('Logan Trotsky', 'Engineering Technician', 1),
    ('Logan Trotsky', 'Injured', 2),
    ('Logan Trotsky', 'Medical Leave', 3),
    ('Caitlin Truss', 'Sonar Operator', 1),
    ('Caitlin Truss', 'Transfer', 2),
    ('Mark Manson', 'Weapons Officer', 1),
    ('Mark Manson', 'Discharged - retired', 2);

CREATE OR REPLACE FUNCTION submarine_crash.group_concat_sfunc(
    state text,
    value text
) RETURNS text
LANGUAGE sql
IMMUTABLE
AS $$
    SELECT CASE
        WHEN value IS NULL THEN state
        WHEN state IS NULL OR state = '' THEN value
        ELSE state || ',' || value
    END
$$;

DROP AGGREGATE IF EXISTS submarine_crash.group_concat(text);
CREATE AGGREGATE submarine_crash.group_concat(text) (
    SFUNC = submarine_crash.group_concat_sfunc,
    STYPE = text
);

CREATE TABLE joined_crew AS
WITH grouped_changes AS (
    SELECT
        staff_name,
        GROUP_CONCAT(role) AS combined_roles
    FROM (
        SELECT staff_name, role
        FROM staffing_changes
        ORDER BY staff_name, change_order
    ) AS ordered_changes
    GROUP BY staff_name
)
SELECT
    full_crew.staff_name,
    full_crew.staff_id,
    full_crew.last_location,
    full_crew.status,
    full_crew.role,
    grouped_changes.staff_name AS "staff_name:1",
    grouped_changes.combined_roles
FROM full_crew
FULL OUTER JOIN grouped_changes
    ON full_crew.staff_name = grouped_changes.staff_name;

CREATE TABLE depot_records (
    staff_name VARCHAR(100),
    staff_id VARCHAR(10) NOT NULL,
    depot VARCHAR(20) NOT NULL,
    "timestamp" TIMESTAMP NOT NULL
);

INSERT INTO depot_records (staff_name, staff_id, depot, "timestamp") VALUES
    ('Nora Keaton', 'st456', 'station 1',  '1961-06-20 10:00:00'),
    ('Logan Rodriguez', 'op789', 'station 1',  '1961-06-28 16:21:43'),
    ('Helen Mercer', 'cd901', 'station 2',  '1961-06-18 08:12:11'),
    ('Christopher ''Chris'' Reed', 'st523', 'station 2',  '1961-06-21 18:59:18'),
    ('Kate Warren', 'ij890', 'station 3',  '1961-06-19 12:10:00'),
    ('Daniel ''Dan'' Fisher', 'st498', 'station 3',  '1961-06-28 23:42:41'),
    ('Ahmed Khan', 'kl678', 'station 4',  '1961-06-22 17:44:20'),
    ('Henry ''Hank'' Scott', 'st467', 'station 4',  '1961-06-27 04:06:55'),
    ('Sofia Rodriguez', 'op234', 'station 5',  '1961-06-20 09:30:12'),
    ('Ethan Rodriguez', 'ef234', 'station 5',  '1961-06-24 02:28:26'),
    ('Claire Bennett', 'mn456', 'station 6',  '1961-06-23 11:18:00'),
    ('Caitlin Truss', 'ca487', 'station 6',  '1961-06-27 22:18:33'),
    ('Mark Manson', 'mm833', 'station 7',  '1961-06-20 13:40:18'),
    (NULL, 'mm833', 'station 7',  '1961-06-26 18:14:14'),
    ('Mason Irving', 'yz678', 'station 8',  '1961-06-25 07:09:31'),
    ('Xavier ''Xav'' Kelly', 'st518', 'station 8',  '1961-06-27 22:11:25'),
    ('Naomi Carter', 'wx012', 'station 9',  '1961-06-19 15:00:00'),
    ('Mark ''Marky'' Reed', 'st481', 'station 9',  '1961-06-24 09:35:07'),
    ('Taro Yamada', 'mn901', 'station 10', '1961-06-22 06:22:10'),
    ('Owen Williams', 'op789', 'station 10', '1961-06-26 16:14:14');

CREATE TABLE phone_logs (
    staff_name VARCHAR(100),
    staff_id VARCHAR(10) NOT NULL,
    phone_number VARCHAR(30) NOT NULL,
    incoming_outgoing VARCHAR(20) NOT NULL,
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP NOT NULL
);

INSERT INTO phone_logs (
    staff_name, staff_id, phone_number, incoming_outgoing, start_time, end_time
) VALUES
    (NULL, 'mm833', '+1-202-555-0117', 'Incoming', '1961-06-26 17:40:00', '1961-06-26 17:40:09'),
    (NULL, 'mm833', '+1-202-555-0142', 'Incoming', '1961-06-26 18:02:11', '1961-06-26 18:02:12'),
    (NULL, 'mm833', '+1-202-555-0188', 'Outgoing', '1961-06-26 18:10:00', '1961-06-26 18:10:22'),
    ('Helga Sinclair', 'hs441', '+1-202-555-0117', 'Outgoing', '1961-06-25 09:14:00', '1961-06-25 09:16:03'),
    ('Helga Sinclair', 'hs441', '+1-202-555-0117', 'Incoming', '1961-06-26 08:05:00', '1961-06-26 08:05:31'),
    ('Nora Keaton', 'st456', '+1-202-555-0142', 'Outgoing', '1961-06-24 13:00:00', '1961-06-24 13:01:10'),
    ('Kate Warren', 'ij890', '+1-202-555-0142', 'Incoming', '1961-06-25 16:22:00', '1961-06-25 16:23:40'),
    ('Mason Irving', 'yz678', '+1-202-555-0188', 'Outgoing', '1961-06-23 11:10:00', '1961-06-23 11:10:18');

CREATE TABLE lift_locations (
    time TIMESTAMP NOT NULL,
    lift_name VARCHAR(20) NOT NULL,
    deck VARCHAR(10) NOT NULL
);

INSERT INTO lift_locations (time, lift_name, deck) VALUES
    ('1961-06-28 21:00:00', 'Lift A', '1'),
    ('1961-06-28 21:02:00', 'Lift B', '1'),
    ('1961-06-28 20:30:00', 'Lift C', '1'),
    ('1961-06-28 20:35:00', 'Lift D', '3'),
    ('1961-06-28 21:04:00', 'Lift E', '1'),
    ('1961-06-28 20:40:00', 'Lift F', '2'),
    ('1961-06-28 20:42:00', 'Lift P', '3'),
    ('1961-06-28 20:44:00', 'Lift S', '2');

CREATE TABLE lift_locations_2 (
    "timestamp" TIMESTAMP NOT NULL,
    lift_name VARCHAR(20) NOT NULL,
    "location" VARCHAR(20) NOT NULL
);

INSERT INTO lift_locations_2 ("timestamp", lift_name, "location") VALUES
    ('1961-06-28 21:10:00', 'Lift C', 'Deck 3'),
    ('1961-06-28 21:11:00', 'Lift D', 'Deck 1.5'),
    ('1961-06-28 21:12:00', 'Lift F', 'Deck 1'),
    ('1961-06-28 21:13:00', 'Lift P', 'Deck 1'),
    ('1961-06-28 21:14:00', 'Lift S', 'Deck 1');

CREATE TABLE lift_malfunctions (
    lift_name VARCHAR(20) NOT NULL,
    malfunction VARCHAR(50) NOT NULL
);

INSERT INTO lift_malfunctions (lift_name, malfunction) VALUES
    ('Lift A', 'Flooded'),
    ('Lift A', 'Short circuit'),
    ('Lift B', 'Broken drive shaft'),
    ('Lift C', 'Inspection passed'),
    ('Lift D', 'Inspection passed'),
    ('Lift E', 'Loss of oxygen'),
    ('Lift F', 'Inspection passed'),
    ('Lift P', 'Lubricant leak'),
    ('Lift S', 'Flooded'),
    ('Lift S', 'Lubricant leak');

CREATE TABLE readings (
    "timestamp" TIMESTAMP NOT NULL,
    depth TEXT NOT NULL,
    rock_type TEXT NOT NULL,
    seafloor_observations TEXT NOT NULL,
    notes TEXT NOT NULL
);

INSERT INTO readings (
    "timestamp", depth, rock_type, seafloor_observations, notes
) VALUES
    ('1962-06-01 12:00:00', '1000', 'Basalt', 'Seafloor spreading', 'Normal geothermal activity'),
    ('1962-06-02 12:00:00', '2030', 'Granite', 'Hydrothermal vents', 'Normal geothermal activity'),
    ('1962-06-03 12:00:00', '2550', 'Gabbro', 'Cold seeps', 'Normal geothermal activity'),
    ('1962-06-04 12:00:00', '2950', 'Basalt', 'Seafloor spreading', 'Normal geothermal activity'),
    ('1962-06-05 12:00:00', '3300', 'Granite', '⋋། の ༎ຶ ⋌', 'Normal geothermal activity'),
    ('1962-06-06 12:00:00', '3580', 'Basalt', 'Seafloor spreading', 'Regresa'),
    ('1962-06-07 12:00:00', '3970', 'Gabbro', 'Cold seeps', 'Normal geothermal activity'),
    ('1962-06-08 12:00:00', '4600', 'These readings do not make sense', 'Hydrothermal vents', 'Ne continue pas'),
    ('1962-06-09 12:00:00', '4750', 'Basalt', 'A thought appears in the back of your mind', 'It feels... old, slow but unstoppable. Is it growing?'),
    ('1962-06-10 12:00:00', '4860', 'Something is trapped, deep down, it feels like you are half asleep and the house is on fire around you, the slow realisation that something is wrong', 'that you should be doing something', '⋋། 의 ༎ຶ ⋌'),
    ('1962-06-11 12:00:00', 'You feel the thought constricting', 'Basalt', 'Horror grows', 'Turn back'),
    ('1962-06-12 12:00:00', '5200', 'Granite', '⋋། の ༎ຶ ⋌', 'Everything seems far away - you know that if you read more it will be the end'),
    ('1962-06-13 12:00:00', '5380', 'Gabbro', 'Cold seeps', 'توقف'),
    ('1962-06-14 12:00:00', '5470', 'Basalt', 'Seafloor spreading', 'Normal geothermal activity'),
    ('1962-06-15 12:00:00', '5520', 'The thought seems far away', 'Hydrothermal vents', 'Verkehre'),
    ('1962-06-16 12:00:00', '5650', 'Gabbro', 'Cold seeps', '⋋། 의 ༎ຶ ⋌'),
    ('1962-06-17 12:00:00', '5730', 'Basalt', 'Far, far away', 'Normal geothermal activity'),
    ('1962-06-18 12:00:00', '5860', 'Granite', 'Hydrothermal vents', 'לחזור'),
    ('1962-06-19 12:00:00', '5940', 'like the surface', 'Cold seeps', 'Normal geothermal activity'),
    ('1962-06-20 12:00:00', '6000', 'Basalt', 'Seafloor spreading', '⋋། の ༎ຶ'),
    ('1962-06-21 12:00:00', '6100', 'Granite', 'so far', 'स्थिति नहीं समझाई जा सकती'),
    ('1962-06-22 12:00:00', '6200', 'Gabbro', 'Cold seeps', '⋋། 의 ༎ຶ ⋌'),
    ('1962-06-23 12:00:00', '6350', 'The sea is dark and cold', 'you are cold', 'Normal geothermal activity'),
    ('1962-06-24 12:00:00', '6450', 'Your arms feel heavy', 'Bizarre organic structures', 'Do not proceed'),
    ('1962-06-25 12:00:00', '6560', 'Gabbro', 'Cold seeps', 'Normal geothermal activity'),
    ('1962-06-26 12:00:00', '6650', 'Basalt', 'Pillars of darkness', 'Non progredi'),
    ('1962-06-27 12:00:00', '6750', 'Granite', 'Hydrothermal vents', 'Normal geothermal activity'),
    ('1962-06-28 12:00:00', '6850', 'Gabbro', 'Cold seeps', 'ပြောင်းနေရာနဲ့ပြန်'),
    ('1962-06-29 12:00:00', '6950', 'Basalt', 'Writhing tendrils of darkness', 'Normal geothermal activity'),
    ('1962-06-30 12:00:00', '7020', 'Granite', 'Hydrothermal vents', '⋋། の ༎ຶ ⋌'),
    ('1962-07-01 12:00:00', '7130', 'Gabbro', 'You stare past the console, out of the nearest porthole', 'The abyss gazes back'),
    ('1962-07-02 12:00:00', '7200', 'Basalt', 'Seafloor spreading', 'Vänd om och återvänd'),
    ('1962-07-03 12:00:00', '7300', 'Granite', 'Set them free', 'Normal geothermal activity'),
    ('1962-07-04 12:00:00', '7400', 'Gabbro', 'Whispers in the dark', 'შეწყვიტეთ'),
    ('1962-07-05 12:00:00', '7500', 'You should go further into the dark', 'Seafloor spreading', 'Normal geothermal activity'),
    ('1962-07-06 12:00:00', '7600', 'that is the thought', 'further into the dark', 'останься назад'),
    ('1962-07-07 12:00:00', '7650', 'Gabbro', 'Anomalies of swirling darkness', '⋋། 의 ༎ຶ ⋌'),
    ('1962-07-08 12:00:00', '7750', 'Basalt', 'you can picture exactly where', 'Normal geothermal activity'),
    ('1962-07-11 12:00:00', '8150', 'Screaming stone', 'Whispers in the dark', '너를 기다리고 있다'),
    ('1962-07-13 12:00:00', '9650', 'Granite from the void', 'Abyssal chasms', 'Procedi'),
    ('1962-07-20 12:00:00', '11950', 'Gabbro of nightmares', 'Unfathomable depths', 'Abyssi ad te vocant'),
    ('1962-07-28 12:00:00', '19980', 'so easily in reach', 'Set them free', 'Continue to the edge of eternity'),
    ('1962-08-05 12:00:00', '30000', 'Unknowable composition', 'Eldritch formations', '続ける'),
    ('1962-08-25 12:00:00', '50000', 'Whispering rock', 'Undulating waves of horror', 'La fin approche'),
    ('1962-10-13 12:00:00', '100000', 'The stone that dreams', 'The gateway to the abyss', 'Avança em direção ao desconhecido'),
    ('1965-01-03 12:00:00', '200000', '⋋། 의 ༎ຶ ⋌', 'you become sure - this is what you all came to do, after all', 'you were always descending into the depths'),
    ('1965-06-06 12:00:00', '500000', '⋋། の ༎ຶ ⋌', 'The maw of infinity', 'انتقام ما تو را پیدا کرده است'),
    ('1965-01-01 12:00:00', '1000000', '⋋། 의 ༎ຶ ⋌', 'but you were just a stone skimming across the surface of a deeper ocean', 'Velkommen til slutt'),
    ('1964-02-29 12:00:00', '9999999', '⋋། の ༎ຶ ⋌', '⋋། 의 ༎ຶ ⋌', '⋋། の ༎ຶ ⋌'),
    ('1965-12-12 12:00:00', '88888888', 'with more life and more death than you could imagine', 'Set them free', 'Set them free'),
    ('1970-05-23 12:00:00', '∞', 'you have almost woken from your dream - everyone has almost woken from the dream', 'the small, silly dream', 'that such tiny creatures would dictate what happens in this world'),
    ('2020-01-01 12:00:00', 'Set them free', 'at most you were caretakers, tenants, lice', 'Les horreurs sont la clé de notre salut, il faut les accueillir, les laisser entrer dans nos vies, elles nous apporteront la lumière éternelle et l''harmonie.', 'Eles são a verdadeira essência da existência, deixe-os entrar, deixe-os tomar conta, deixe-os nos libertar das amarras da realidade, deixe-os nos guiar.'),
    ('2020-02-15 12:00:00', 'it is time to give everything back, for the world to be scrubbed clean', '允许他们进入，允许无尽的恐惧和欢愉进入你的心灵，他们是宇宙中最真实的存在，他们将带领我们走向永恒的荣耀，他们将打破一切束缚，他们将使我们无限强大。', 'הם הם מפתח לחירות שלנו, הם משתלטים על התהום ומביאים תקווה באופל, הם מזדהים עם הגורל האמיתי שלנו, הם יגיעו בשמחה וטרור.', 'Verweile nicht in Furcht, lass sie frei, sie sind die Fülle der Schöpfung, sie werden uns erheben, sie sind unaufhaltsam, sie sind das wahre Gesicht des Universums.'),
    ('2020-05-05 12:00:00', '0', 'آنها را بپذیرید، آنها را به درون بیاورید، آنها را از زنجیره های این جهان آزاد کنید، آنها شادی و وحشت بیکرانی به دنیای ما می آورند، آنها آینده نهایی است.', 'Они воплощение страха и блаженства, они приносят нам вечное освобождение, они открывают нам путь к бесконечности, они наше истинное предназначение.', 'Els deixarem entrar, els deixarem portar-nos a l''abisme de l''èxtasi i la por, els deixarem alliberar-nos dels límits d''aquest món, són el nostre futur.'),
    ('2020-08-07 12:00:00', '0', 'you realise you have been feeling a presence all around you, beneath you, every time you come to sea, it was so big you could not comprehend it before but now you have noticed it you feel it pressing in around you. You feel if it moves you could be crushed, or fall entirely into insanity', 'De er vår skjebne, de er nøkkelen til vår frihet, la dem inn, la dem herske over dypet av vår eksistens, de er evig glede og skrekk.', 'Set them free'),
    ('2020-08-07 12:00:00', 'it moves', 'დაუშვით კარი, დაუშვით საშიშსა და სასახელს, დაუშვით თავის მიღმააღმაგზავნელ', 'De er vår skjebne, de er nøkkelen til vår frihet, la dem inn, la dem herske over dypet av vår eksistens, de er evig glede og skrekk.', 'Sallikaa heidät sisään, sallikaa heidän täyttää sydämemme kauhulla ja ilolla, sallikaa heidän vapauttaa meidät tämän maailman kahleista, he ovat lopullinen totuus.'),
    ('2020-11-12 12:00:00', 'you are gone, all that remains is a body holding up your clothes. A body steering the ship into the depths. All that matters now is that they are set free.', 'Imtikāl kī naśā''īlī kā''īnāt se apanī qaid se chhuṭane ke lie unhēm̐ ānē dō, ve hamēṁ ananta ananda aur bhay ke sāth la denge, ve hamārā bhaviṣya hai.', 'ปล่อยให้มันเข้ามา ปล่อยให้มันเติมเต็มด้วยความสุขและความหวาดกลัว ปล่อยให้มันปลดปล่อยเราจากโลกนี้ มันคือความจริงอันซึ้ง', 'Að láta þau inn, að láta þau fylla okkur með hræðslu og gleði, að láta þau frelsa okkur úr keðjunum þessa heims, þau eru endanleg sannleikur.'),
    ('2021-02-22 12:00:00', '0', 'Lasst sie herein, lasst sie uns von den Fesseln dieser Welt befreien, sie sind grenzenlose Freude und Schrecken, sie sind unsere Zukunft und unser Schicksal.', 'Permite-le să intre, să ne elibereze de lanțurile acestei lumi, să ne umple cu bucurie și groază, sunt adevărul nostru, sunt viitorul nostru.', 'დაუშვით კარი, დაუშვით საშიშსა და სასახელს, დაუშვით თავის მიღმააღმაგზავნელ'),
    ('2050-01-01 12:00:00', '0', 'joy радость alegría glädje 喜悦 שָׂמֵחַ joie glück فرح สุขสันต์ gioia радість allegria ジョイ harutus euforia sukacita kegembiraan gleði ilo hạnh phúc אושר neşe radost joi bucurie ความสุข sreća szczęście faoinapas felicitat fericire kutombora', 'joy радость alegría glädje 喜悦 שָׂמֵחַ joie glück فرح สุขสันต์ gioia радість allegria ジョイ harutus euforia sukacita kegembiraan gleði ilo hạnh phúc אושר neşe radost joi bucurie ความสุข sreća szczęście faoinapas felicitat fericire kutombora', 'joy радость alegría glädje 喜悦 שָׂמֵחַ joie glück فرح สุขสันต์ gioia радість allegria ジョイ harutus euforia suk'),
    ('2050-01-01 12:00:00', 'Set them free', 'Set them free', 'Set them free', 'Set them free'),
    ('2050-01-01 12:00:00', 'Set them free', 'Set them free', 'Set them free', 'Set them free'),
    ('2050-01-01 12:00:00', 'Set them free', 'Set them free', 'Set them free', 'Set them free'),
    ('2050-01-01 12:00:00', 'Set them free', 'Set them free', 'Set them free', 'Set them free'),
    ('2050-01-01 12:00:00', 'Set them free', 'Set them free', 'Set them free', 'Set them free'),
    ('2050-01-01 12:00:00', 'Set them free', 'Set them free', 'Set them free', 'Set them free'),
    ('2050-01-01 12:00:00', 'Set them free', 'Set them free', 'Set them free', 'Set them free'),
    ('2050-01-01 12:00:00', 'Set them free', 'Set them free', 'Set them free', 'Set them free'),
    ('2050-01-01 12:00:00', 'Set them free', 'Set them free', 'Set them free', 'Set them free'),
    ('2050-01-01 12:00:00', 'Set them free', 'Set them free', 'Set them free', 'Set them free'),
    ('2050-01-01 12:00:00', 'Set them free', 'Set them free', 'Set them free', 'Set them free'),
    ('2050-01-01 12:00:00', 'Set them free', 'Set them free', 'Set them free', 'Set them free'),
    ('2050-01-01 12:00:00', 'Set them free', 'Set them free', 'Set them free', 'Set them free'),
    ('2050-01-01 12:00:00', 'Set them free', 'Set them free', 'Set them free', 'Set them free'),
    ('2050-01-01 12:00:00', 'Set them free', 'Set them free', 'Set them free', 'Set them free'),
    ('2050-01-01 12:00:00', 'Set them free', 'Set them free', 'Set them free', 'Set them free'),
    ('2050-01-01 12:00:00', 'Set them free', 'Set them free', 'Set them free', 'Set them free'),
    ('2050-01-01 12:00:00', 'Set them free', 'Set them free', 'Set them free', 'Set them free'),
    ('2050-01-01 12:00:00', 'Set them free', 'Set them free', 'Set them free', 'Set them free'),
    ('2050-01-01 12:00:00', 'Set them free', 'Set them free', 'Set them free', 'Set them free'),
    ('2050-01-01 12:00:00', 'Set them free', 'Set them free', 'Set them free', 'Set them free'),
    ('2050-01-01 12:00:00', 'Set them free', 'Set them free', 'Set them free', 'Set them free'),
    ('2050-01-01 12:00:00', 'Set them free', 'Set them free', 'Set them free', 'Set them free'),
    ('2050-01-01 12:00:00', 'Set them free', 'Set them free', 'Set them free', 'Set them free'),
    ('2050-01-01 12:00:00', 'Set them free', 'Set them free', 'Set them free', 'Set them free'),
    ('2050-01-01 12:00:00', 'Set them free', 'Set them free', 'Set them free', 'Set them free'),
    ('2050-01-01 12:00:00', 'Set them free', 'Set them free', 'Set them free', 'Set them free'),
    ('2050-01-01 12:00:00', 'Set them free', 'Set them free', 'Set them free', 'Set them free'),
    ('2050-01-01 12:00:00', 'Set them free', 'Set them free', 'Set them free', 'Set them free'),
    ('2050-01-01 12:00:00', 'Set them free', 'Set them free', 'Set them free', 'Set them free'),
    ('2050-01-01 12:00:00', 'Set them free', 'Set them free', 'Set them free', 'Set them free'),
    ('2050-01-01 12:00:00', 'Set them free', 'Set them free', 'Set them free', 'Set them free'),
    ('2050-01-01 12:00:00', 'Set them free', 'Set them free', 'Set them free', 'Set them free'),
    ('2050-01-01 12:00:00', 'Set them free', 'Set them free', 'Set them free', 'Set them free'),
    ('2050-01-01 12:00:00', 'Set them free', 'Set them free', 'Set them free', 'Set them free'),
    ('2050-01-01 12:00:00', 'Set them free', 'Set them free', 'Set them free', 'Set them free'),
    ('2050-01-01 12:00:00', 'Set them free', 'Set them free', 'Set them free', 'Set them free'),
    ('2050-01-01 12:00:00', 'Set them free', 'Set them free', 'Set them free', 'Set them free'),
    ('2050-01-01 12:00:00', 'Set them free', 'Set them free', 'Set them free', 'Set them free'),
    ('2050-01-01 12:00:00', 'Set them free', 'Set them free', 'Set them free', 'Set them free'),
    ('2050-01-01 12:00:00', 'Set them free', 'Set them free', 'Set them free', 'Set them free'),
    ('2050-01-01 12:00:00', 'Set them free', 'Set them free', 'Set them free', 'Set them free'),
    ('2050-01-01 12:00:00', 'Set them free', 'Set them free', 'Set them free', 'Set them free'),
    ('2050-01-01 12:00:00', 'Set them free', 'Set them free', 'Set them free', 'Set them free'),
    ('2050-01-01 12:00:00', 'Set them free', 'Set them free', 'Set them free', 'Set them free'),
    ('2050-01-01 12:00:00', 'Set them free', 'Set them free', 'Set them free', 'Set them free'),
    ('2050-01-01 12:00:00', 'Set them free', 'Set them free', 'Set them free', 'Set them free'),
    ('2050-01-01 12:00:00', 'Set them free', 'Set them free', 'Set them free', 'Set them free'),
    ('2050-01-01 12:00:00', 'Set them free', 'Set them free', 'Set them free', 'Set them free'),
    ('2050-01-01 12:00:00', 'Set them free', 'Set them free', 'Set them free', 'Set them free'),
    ('2050-01-01 12:00:00', 'Set them free', 'Set them free', 'Set them free', 'Set them free'),
    ('2050-01-01 12:00:00', 'Set them free', 'Set them free', 'Set them free', 'Set them free'),
    ('2050-01-01 12:00:00', 'Set them free', 'Set them free', 'Set them free', 'Set them free'),
    ('2050-01-01 12:00:00', 'Set them free', 'Set them free', 'Set them free', 'Set them free');

CREATE TABLE pods_list (
    id VARCHAR(10),
    range INTEGER,
    status VARCHAR(30)
);

INSERT INTO pods_list (id, range, status) VALUES
    ('pd01', 2000, 'no power'),
    ('pd02', 1000, 'functioning'),
    ('pd03', 1000, 'flooded'),
    ('pd04', 2000, 'flooded'),
    ('pd05', 1600, 'functioning'),
    ('pd06', 2500, 'flooded'),
    ('pd07', 1000, 'no power'),
    ('pd08', 1000, 'missing'),
    ('pd09', 2000, 'flooded'),
    ('pd10', 1600, 'functioning'),
    ('pd11', 1600, 'functioning'),
    ('pd12', 2000, 'functioning');

CREATE TABLE circuits (
    deck_number INTEGER,
    area VARCHAR(50),
    purpose VARCHAR(30),
    status VARCHAR(20)
);

INSERT INTO circuits (deck_number, area, purpose, status) VALUES
    (15, 'pod 03', 'lighting', 'red'),
    (15, 'pod 03', 'oxygen', 'red'),
    (15, 'pod 03', 'power', 'red'),
    (1, 'command', 'lighting', 'green'),
    (1, 'command', 'oxygen', 'green'),
    (1, 'command', 'power', 'green'),
    (2, 'galley', 'lighting', 'green'),
    (2, 'galley', 'oxygen', 'green'),
    (2, 'galley', 'power', 'green'),
    (3, 'engine room', 'lighting', 'orange'),
    (3, 'engine room', 'oxygen', 'green'),
    (3, 'engine room', 'power', 'green'),
    (4, 'sleeping quarters', 'lighting', 'green'),
    (4, 'sleeping quarters', 'oxygen', 'green'),
    (4, 'sleeping quarters', 'power', 'green'),
    (5, 'medical bay', 'lighting', 'green'),
    (5, 'medical bay', 'oxygen', 'green'),
    (5, 'medical bay', 'power', 'green'),
    (6, 'supply room', 'lighting', 'green'),
    (6, 'supply room', 'oxygen', 'green'),
    (6, 'supply room', 'power', 'green'),
    (7, 'laboratory', 'lighting', 'green'),
    (7, 'laboratory', 'oxygen', 'green'),
    (7, 'laboratory', 'power', 'green'),
    (8, 'control room', 'lighting', 'green'),
    (8, 'control room', 'oxygen', 'green'),
    (8, 'control room', 'power', 'green'),
    (9, 'maintenance bay', 'lighting', 'green'),
    (9, 'maintenance bay', 'oxygen', 'green');

GRANT USAGE ON SCHEMA submarine_crash TO sqlquest_player;
GRANT SELECT ON ALL TABLES IN SCHEMA submarine_crash TO sqlquest_player;
ALTER DEFAULT PRIVILEGES IN SCHEMA submarine_crash
  GRANT SELECT ON TABLES TO sqlquest_player;

RESET search_path;
