-- Seed 17 Nigerian festive periods for 2026.
-- Islamic dates (Eid el-Fitr, Eid el-Kabir, Maulud) are approximate —
-- admin should update target_date each year once the Federal Ministry confirms.
-- All savings_end_dates are set one day before target_date.

insert into public.festive_periods
  (name, slug, description, category, emoji, color, target_date, savings_start_date, savings_end_date, suggested_frequency, year)
values
  (
    'New Year Celebration',
    'new-year-2026',
    'Save for new year parties, new outfits, gifts, and fresh-year expenses.',
    'national', '', '#3B82F6',
    '2026-01-01', '2025-10-01', '2025-12-31',
    'monthly', 2026
  ),
  (
    'Valentine''s Day',
    'valentines-day-2026',
    'Save for gifts, dinner outings, and surprises for your loved ones.',
    'cultural', '', '#EC4899',
    '2026-02-14', '2026-01-01', '2026-02-13',
    'weekly', 2026
  ),
  (
    'Eid el-Fitr (Sallah 1)',
    'eid-el-fitr-2026',
    'Save for new clothes, food, travel home, gifts, and Sallah celebrations.',
    'religious', '', '#F59E0B',
    '2026-03-20', '2026-01-01', '2026-03-19',
    'weekly', 2026
  ),
  (
    'Easter & Good Friday',
    'easter-2026',
    'Save for travel, family gatherings, new outfits, and Easter food.',
    'religious', '', '#8B5CF6',
    '2026-04-03', '2026-02-01', '2026-04-02',
    'weekly', 2026
  ),
  (
    'Workers'' Day',
    'workers-day-2026',
    'Save for the May Day holiday, short trips, or relaxation.',
    'national', '', '#6366F1',
    '2026-05-01', '2026-03-01', '2026-04-30',
    'monthly', 2026
  ),
  (
    'Eid el-Kabir (Ileya / Sallah 2)',
    'eid-el-kabir-2026',
    'Save for ram purchase, feasting, fabrics, and family celebrations.',
    'religious', '', '#F59E0B',
    '2026-05-27', '2026-02-01', '2026-05-26',
    'weekly', 2026
  ),
  (
    'Democracy Day',
    'democracy-day-2026',
    'Save for the June 12 public holiday celebrations.',
    'national', '', '#3B82F6',
    '2026-06-12', '2026-04-01', '2026-06-11',
    'monthly', 2026
  ),
  (
    'Graduation Season',
    'graduation-season-2026',
    'Save for graduation gifts, owambe parties, aso-ebi, and celebrations.',
    'cultural', '', '#10B981',
    '2026-07-31', '2026-04-01', '2026-07-30',
    'monthly', 2026
  ),
  (
    'Back to School',
    'back-to-school-2026',
    'Save for school fees, uniforms, books, supplies, and September resumption.',
    'cultural', '', '#0EA5E9',
    '2026-09-01', '2026-06-01', '2026-08-31',
    'monthly', 2026
  ),
  (
    'Maulud (Prophet''s Birthday)',
    'maulud-2026',
    'Save for Islamic celebrations, food sharing, and community giving.',
    'religious', '', '#F59E0B',
    '2026-08-26', '2026-06-01', '2026-08-25',
    'monthly', 2026
  ),
  (
    'New Yam Festival',
    'new-yam-festival-2026',
    'Save for travel to village, cultural festivities, and new yam celebrations.',
    'cultural', '', '#84CC16',
    '2026-09-15', '2026-07-01', '2026-09-14',
    'monthly', 2026
  ),
  (
    'Independence Day',
    'independence-day-2026',
    'Save for October 1 celebrations, outings, and national pride events.',
    'national', '', '#22C55E',
    '2026-10-01', '2026-08-01', '2026-09-30',
    'monthly', 2026
  ),
  (
    'Wedding & Owambe Season',
    'wedding-season-2026',
    'Save for aso-ebi fabrics, shoes, accessories, and venue gifts for October–December weddings.',
    'cultural', '', '#F97316',
    '2026-12-15', '2026-09-01', '2026-12-14',
    'monthly', 2026
  ),
  (
    'Detty December',
    'detty-december-2026',
    'Save for Nigeria''s biggest party month — concerts, travel, new fits, and end-of-year vibes.',
    'cultural', '', '#EF4444',
    '2026-12-01', '2026-08-01', '2026-11-30',
    'monthly', 2026
  ),
  (
    'Christmas & Boxing Day',
    'christmas-2026',
    'Save for Christmas food, gifts, new clothes, travel, and family gatherings.',
    'national', '', '#DC2626',
    '2026-12-25', '2026-09-01', '2026-12-24',
    'monthly', 2026
  ),
  (
    'Annual Rent Payment',
    'annual-rent-2026',
    'Save throughout the year to cover your annual or bi-annual house rent renewal.',
    'personal', '', '#6B7280',
    '2027-01-15', '2026-01-01', '2027-01-14',
    'monthly', 2026
  ),
  (
    'January School Fees',
    'school-fees-jan-2026',
    'Save from October to cover first-term or resumption school fees in January.',
    'cultural', '', '#0EA5E9',
    '2027-01-10', '2026-10-01', '2027-01-09',
    'monthly', 2026
  );
