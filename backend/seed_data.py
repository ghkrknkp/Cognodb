"""
seed_data.py — Seeds comprehensive All-India Transit & High-Speed Rail Network into CognoDB.
Covers Delhi NCR, Mumbai, Bengaluru, Kolkata, Chennai, Hyderabad, Pune, Ahmedabad, Kochi,
and Pan-India Vande Bharat & High-Speed Express Corridors.

Idempotent: Uses MERGE to safely update or insert nodes and edges.
"""

import os
import sys
from neo4j import GraphDatabase
from dotenv import load_dotenv

load_dotenv()

URI      = os.getenv("COGNODB_URI", "")
USER     = os.getenv("COGNODB_USER", "cognodb")
PASSWORD = os.getenv("COGNODB_PASSWORD", "")

if not URI or not PASSWORD:
    sys.exit("[-] Set COGNODB_URI and COGNODB_PASSWORD in backend/.env first.")

# ──────────────────────────────────────────────────────────────────────────────
#  ALL-INDIA STATIONS (Coordinates: lat, lon)
# ──────────────────────────────────────────────────────────────────────────────

STATIONS = [
    # ── DELHI NCR METRO & RAIL ──
    ("del_ndls",        "New Delhi Central",       "Delhi NCR",    "North", 28.6428, 77.2195),
    ("del_rajiv_chowk", "Rajiv Chowk (Connaught)", "Delhi NCR",    "Central",28.6328, 77.2195),
    ("del_kashmere_gt", "Kashmere Gate Hub",       "Delhi NCR",    "North", 28.6675, 77.2285),
    ("del_chandni_ck",  "Chandni Chowk",           "Delhi NCR",    "North", 28.6575, 77.2305),
    ("del_central_sec", "Central Secretariat",     "Delhi NCR",    "Central",28.6148, 77.2119),
    ("del_hauz_khas",   "Hauz Khas Junction",      "Delhi NCR",    "South", 28.5432, 77.2065),
    ("del_aiims",       "AIIMS",                   "Delhi NCR",    "South", 28.5684, 77.2078),
    ("del_noida_sec62", "Noida Electronic City",   "Noida (NCR)",  "East",  28.6280, 77.3742),
    ("del_botanical_g", "Botanical Garden",        "Noida (NCR)",  "East",  28.5641, 77.3342),
    ("del_cyber_city",  "Cyber City",              "Gurgaon (NCR)","South", 28.4950, 77.0890),
    ("del_iffco_chowk", "IFFCO Chowk",             "Gurgaon (NCR)","South", 28.4720, 77.0720),
    ("del_airport_t3",  "IGI Airport T3",          "Delhi NCR",    "West",  28.5562, 77.0856),
    ("del_dwarka_sec21","Dwarka Sector 21",        "Delhi NCR",    "West",  28.5523, 77.0583),

    # ── MUMBAI MMR METRO & RAIL ──
    ("mum_csmt",        "CSMT Heritage Hub",       "Mumbai",       "South", 18.9398, 72.8355),
    ("mum_churchgate",  "Churchgate",              "Mumbai",       "South", 18.9356, 72.8266),
    ("mum_dadar",       "Dadar Super-Hub",         "Mumbai",       "Central",19.0186, 72.8432),
    ("mum_bandra",      "Bandra West / BKC",       "Mumbai",       "West",  19.0550, 72.8403),
    ("mum_andheri",     "Andheri Interchange",     "Mumbai",       "West",  19.1197, 72.8468),
    ("mum_borivali",    "Borivali Gateway",        "Mumbai",       "North", 19.2288, 72.8566),
    ("mum_kurla",       "Kurla Junction",          "Mumbai",       "East",  19.0653, 72.8792),
    ("mum_ghatkopar",   "Ghatkopar Metro-Rail",    "Mumbai",       "East",  19.0860, 72.9081),
    ("mum_thane",       "Thane Central",           "Thane (MMR)",  "North", 19.1860, 72.9759),
    ("mum_airport",     "Mumbai CSMI Airport T2",  "Mumbai",       "West",  19.0968, 72.8744),
    ("mum_navi_mumbai", "Navi Mumbai Vashi",       "Navi Mumbai",  "East",  19.0771, 72.9986),

    # ── BENGALURU (NAMMA METRO & RAIL) ──
    ("blr_majestic",    "Majestic (Kempegowda)",   "Bengaluru",    "Central",12.9756, 77.5728),
    ("blr_mg_road",     "MG Road Boulevard",       "Bengaluru",    "Central",12.9754, 77.6066),
    ("blr_indiranagar", "Indiranagar",             "Bengaluru",    "East",  12.9784, 77.6408),
    ("blr_whitefield",  "Whitefield Tech Hub",     "Bengaluru",    "East",  12.9698, 77.7499),
    ("blr_silk_board",  "Silk Board Junction",     "Bengaluru",    "South", 12.9175, 77.6238),
    ("blr_electronic_c","Electronic City Phase 1", "Bengaluru",    "South", 12.8452, 77.6602),
    ("blr_yeshwanthpur","Yeshwanthpur Junction",   "Bengaluru",    "North", 13.0238, 77.5503),
    ("blr_jayanagar",   "Jayanagar 4th Block",     "Bengaluru",    "South", 12.9298, 77.5828),

    # ── HYDERABAD (HYDERABAD METRO) ──
    ("hyd_secunderabad","Secunderabad Central",    "Hyderabad",    "North", 17.4399, 78.4983),
    ("hyd_ameerpet",    "Ameerpet Interchange",    "Hyderabad",    "Central",17.4375, 78.4483),
    ("hyd_hitec_city",  "HITEC City Cyber Towers", "Hyderabad",    "West",  17.4475, 78.3762),
    ("hyd_mgbs",        "MGBS Bus & Rail Terminal","Hyderabad",    "South", 17.3789, 78.4812),
    ("hyd_jubilee_hills","Jubilee Hills Checkpost", "Hyderabad",    "West",  17.4285, 78.4112),
    ("hyd_gachibowli",  "Gachibowli Stadium Hub",  "Hyderabad",    "West",  17.4401, 78.3489),

    # ── CHENNAI (METRO & SUBURBAN) ──
    ("chn_central",     "Chennai Central Hub",     "Chennai",      "North", 13.0827, 80.2707),
    ("chn_egmore",      "Chennai Egmore",          "Chennai",      "Central",13.0784, 80.2612),
    ("chn_airport",     "Chennai Airport Metro",   "Chennai",      "South", 12.9818, 80.1639),
    ("chn_guindy",      "Guindy Tech Corridor",    "Chennai",      "South", 13.0067, 80.2021),
    ("chn_t_nagar",     "T. Nagar Hub",            "Chennai",      "Central",13.0418, 80.2341),
    ("chn_koyambedu",   "Koyambedu CMBT",          "Chennai",      "West",  13.0694, 80.1948),

    # ── KOLKATA (METRO & HOWRAH UNDERWATER) ──
    ("kol_howrah",      "Howrah Railway & Metro",  "Kolkata",      "West",  22.5850, 88.3426),
    ("kol_sealdah",     "Sealdah Junction",        "Kolkata",      "Central",22.5697, 88.3711),
    ("kol_esplanade",   "Esplanade Super-Exchange","Kolkata",      "Central",22.5645, 88.3518),
    ("kol_park_street", "Park Street Heritage",    "Kolkata",      "Central",22.5512, 88.3524),
    ("kol_salt_lake_v", "Salt Lake Sector V (IT)", "Kolkata",      "East",  22.5804, 88.4373),
    ("kol_dum_dum",     "Dum Dum Airport Link",    "Kolkata",      "North", 22.6534, 88.4357),

    # ── PUNE (METRO & SUBURBAN) ──
    ("pun_station",     "Pune Central Station",    "Pune",         "East",  18.5296, 73.8739),
    ("pun_shivajinagar","Shivajinagar Interchange","Pune",         "Central",18.5302, 73.8476),
    ("pun_hinjawadi",   "Hinjawadi IT Park Hub",   "Pune",         "West",  18.5913, 73.7389),
    ("pun_swargate",    "Swargate Multi-Modal",    "Pune",         "South", 18.5018, 73.8580),
    ("pun_vanaz",       "Vanaz Metro",             "Pune",         "West",  18.5085, 73.8052),

    # ── AHMEDABAD & GANDHINAGAR ──
    ("ahm_kalupur",     "Ahmedabad Kalupur Rail",  "Ahmedabad",    "Central",23.0225, 72.5714),
    ("ahm_thaltej",     "Thaltej Metro",           "Ahmedabad",    "West",  23.0515, 72.5125),
    ("ahm_gift_city",   "GIFT City International", "Gandhinagar",  "North", 23.1601, 72.6841),

    # ── JAIPUR & NORTHERN NODES ──
    ("jai_station",     "Jaipur Junction",         "Jaipur",       "Central",26.9200, 75.7873),
    ("jai_chandpole",   "Chandpole Metro",         "Jaipur",       "Central",26.9250, 75.8050),
    ("agr_cantt",       "Agra Cantt (Taj Hub)",    "Agra",         "North", 27.1593, 78.0064),
    ("chd_junction",    "Chandigarh Junction",     "Chandigarh",   "North", 30.7016, 76.8213),
    ("var_junction",    "Varanasi Cantt (Kashi)",  "Varanasi",     "East",  25.3268, 82.9860),
    ("luc_charbagh",    "Lucknow Charbagh",        "Lucknow",      "Central",26.8322, 80.9197),

    # ── SOUTHERN NODES ──
    ("koc_aluva",       "Kochi Aluva Hub",         "Kochi",        "North", 10.1076, 76.3516),
    ("koc_mg_road",     "Kochi MG Road",           "Kochi",        "Central",9.9723,  76.2858),
    ("cbe_junction",    "Coimbatore Junction",     "Coimbatore",   "South", 11.0016, 76.9629),
]

# ──────────────────────────────────────────────────────────────────────────────
#  TRANSIT LINES & NATIONAL CORRIDORS
# ──────────────────────────────────────────────────────────────────────────────

LINES = [
    # Delhi Lines
    ("del_yellow",  "Delhi Metro Yellow Line",       "metro",       "#F59E0B"),
    ("del_blue",    "Delhi Metro Blue Line",         "metro",       "#3B82F6"),
    ("del_magenta", "Delhi Metro Magenta Line",      "metro",       "#EC4899"),
    ("del_airport", "Delhi Airport Express",         "metro",       "#F97316"),

    # Mumbai Lines
    ("mum_wr",      "Mumbai Western Railway",        "suburban",    "#EF4444"),
    ("mum_cr",      "Mumbai Central Railway",        "suburban",    "#0284C7"),
    ("mum_m1",      "Mumbai Metro Line 1",           "metro",       "#10B981"),
    ("mum_harbour", "Mumbai Harbour Link",           "suburban",    "#8B5CF6"),

    # Bengaluru Lines
    ("blr_purple",  "Namma Metro Purple Line",       "metro",       "#9333EA"),
    ("blr_green",   "Namma Metro Green Line",        "metro",       "#16A34A"),
    ("blr_silk_m",  "Bengaluru Tech Corridor Express","metro",      "#E11D48"),

    # Hyderabad Lines
    ("hyd_red",     "Hyderabad Metro Red Line",      "metro",       "#DC2626"),
    ("hyd_blue",    "Hyderabad Metro Blue Line",     "metro",       "#2563EB"),

    # Kolkata Lines
    ("kol_green",   "Kolkata Underwater Metro (EW)", "metro",       "#059669"),
    ("kol_blue",    "Kolkata North-South Metro",     "metro",       "#0284C7"),

    # Chennai Lines
    ("chn_blue",    "Chennai Metro Blue Line",       "metro",       "#38BDF8"),
    ("chn_green",   "Chennai Metro Green Line",      "metro",       "#22C55E"),

    # Pune & Ahmedabad
    ("pun_metro1",  "Pune Metro Purple Line",        "metro",       "#A855F7"),
    ("ahm_metro",   "Ahmedabad Metro Line 1",        "metro",       "#F43F5E"),

    # Pan-India High Speed & Vande Bharat Corridors
    ("vb_del_mum",  "Vande Bharat Express: Delhi-Mumbai",  "high_speed", "#E11D48"),
    ("vb_del_jai",  "Vande Bharat: Delhi-Jaipur",          "high_speed", "#6366F1"),
    ("vb_del_var",  "Vande Bharat: Delhi-Agra-Varanasi",   "high_speed", "#8B5CF6"),
    ("vb_del_chd",  "Vande Bharat: Delhi-Chandigarh",      "high_speed", "#14B8A6"),
    ("vb_mum_pun",  "Deccan Queen Express: Mumbai-Pune",   "high_speed", "#F59E0B"),
    ("vb_mum_ahm",  "Bullet Train Corridor: Mumbai-Ahmedabad","high_speed","#06D6A0"),
    ("vb_blr_chn",  "Vande Bharat: Bengaluru-Chennai",     "high_speed", "#3B82F6"),
    ("vb_blr_hyd",  "Vande Bharat: Bengaluru-Hyderabad",   "high_speed", "#10B981"),
    ("vb_chn_koc",  "Vande Bharat: Chennai-Kochi Express", "high_speed", "#EC4899"),
    ("vb_kol_var",  "Poorva Express: Kolkata-Varanasi",    "high_speed", "#84CC16"),
]

# (line_id, station_id, stop_order)
LINE_STOPS = [
    # Delhi Yellow
    ("del_yellow", "del_kashmere_gt", 1), ("del_yellow", "del_chandni_ck", 2),
    ("del_yellow", "del_ndls", 3),        ("del_yellow", "del_rajiv_chowk", 4),
    ("del_yellow", "del_central_sec", 5), ("del_yellow", "del_aiims", 6),
    ("del_yellow", "del_hauz_khas", 7),   ("del_yellow", "del_iffco_chowk", 8),

    # Delhi Blue
    ("del_blue", "del_dwarka_sec21", 1),  ("del_blue", "del_rajiv_chowk", 2),
    ("del_blue", "del_botanical_g", 3),   ("del_blue", "del_noida_sec62", 4),

    # Delhi Magenta
    ("del_magenta", "del_botanical_g", 1),("del_magenta", "del_hauz_khas", 2),
    ("del_magenta", "del_airport_t3", 3), ("del_magenta", "del_dwarka_sec21", 4),

    # Delhi Airport Express
    ("del_airport", "del_ndls", 1), ("del_airport", "del_airport_t3", 2),
    ("del_airport", "del_dwarka_sec21", 3),

    # Mumbai Western
    ("mum_wr", "mum_churchgate", 1), ("mum_wr", "mum_dadar", 2),
    ("mum_wr", "mum_bandra", 3),     ("mum_wr", "mum_andheri", 4),
    ("mum_wr", "mum_borivali", 5),

    # Mumbai Central
    ("mum_cr", "mum_csmt", 1),       ("mum_cr", "mum_dadar", 2),
    ("mum_cr", "mum_kurla", 3),      ("mum_cr", "mum_ghatkopar", 4),
    ("mum_cr", "mum_thane", 5),

    # Mumbai Metro 1
    ("mum_m1", "mum_andheri", 1),    ("mum_m1", "mum_airport", 2),
    ("mum_m1", "mum_ghatkopar", 3),

    # Mumbai Harbour
    ("mum_harbour", "mum_csmt", 1),  ("mum_harbour", "mum_kurla", 2),
    ("mum_harbour", "mum_navi_mumbai", 3),

    # Bengaluru Purple
    ("blr_purple", "blr_majestic", 1), ("blr_purple", "blr_mg_road", 2),
    ("blr_purple", "blr_indiranagar", 3), ("blr_purple", "blr_whitefield", 4),

    # Bengaluru Green
    ("blr_green", "blr_yeshwanthpur", 1), ("blr_green", "blr_majestic", 2),
    ("blr_green", "blr_jayanagar", 3),    ("blr_green", "blr_silk_board", 4),

    # Bengaluru Tech Corridor
    ("blr_silk_m", "blr_silk_board", 1),  ("blr_silk_m", "blr_electronic_c", 2),

    # Hyderabad Red
    ("hyd_red", "hyd_secunderabad", 1), ("hyd_red", "hyd_ameerpet", 2),
    ("hyd_red", "hyd_mgbs", 3),

    # Hyderabad Blue
    ("hyd_blue", "hyd_hitec_city", 1),  ("hyd_blue", "hyd_jubilee_hills", 2),
    ("hyd_blue", "hyd_ameerpet", 3),    ("hyd_blue", "hyd_secunderabad", 4),

    # Kolkata Green (Underwater)
    ("kol_green", "kol_howrah", 1),    ("kol_green", "kol_esplanade", 2),
    ("kol_green", "kol_sealdah", 3),   ("kol_green", "kol_salt_lake_v", 4),

    # Kolkata Blue
    ("kol_blue", "kol_dum_dum", 1),    ("kol_blue", "kol_esplanade", 2),
    ("kol_blue", "kol_park_street", 3),

    # Chennai Blue
    ("chn_blue", "chn_central", 1),    ("chn_blue", "chn_t_nagar", 2),
    ("chn_blue", "chn_guindy", 3),     ("chn_blue", "chn_airport", 4),

    # Chennai Green
    ("chn_green", "chn_central", 1),   ("chn_green", "chn_egmore", 2),
    ("chn_green", "chn_koyambedu", 3),

    # Pune Metro
    ("pun_metro1", "pun_vanaz", 1),    ("pun_metro1", "pun_shivajinagar", 2),
    ("pun_metro1", "pun_station", 3),  ("pun_metro1", "pun_swargate", 4),

    # Ahmedabad
    ("ahm_metro", "ahm_thaltej", 1),   ("ahm_metro", "ahm_kalupur", 2),
    ("ahm_metro", "ahm_gift_city", 3),

    # Vande Bharat Corridors
    ("vb_del_mum", "del_ndls", 1),    ("vb_del_mum", "jai_station", 2),
    ("vb_del_mum", "ahm_kalupur", 3), ("vb_del_mum", "mum_borivali", 4),
    ("vb_del_mum", "mum_csmt", 5),

    ("vb_del_jai", "del_ndls", 1),    ("vb_del_jai", "del_cyber_city", 2),
    ("vb_del_jai", "jai_station", 3),

    ("vb_del_var", "del_ndls", 1),    ("vb_del_var", "agr_cantt", 2),
    ("vb_del_var", "luc_charbagh", 3),("vb_del_var", "var_junction", 4),

    ("vb_del_chd", "del_ndls", 1),    ("vb_del_chd", "chd_junction", 2),

    ("vb_mum_pun", "mum_csmt", 1),    ("vb_mum_pun", "mum_dadar", 2),
    ("vb_mum_pun", "mum_thane", 3),   ("vb_mum_pun", "pun_shivajinagar", 4),
    ("vb_mum_pun", "pun_station", 5),

    ("vb_mum_ahm", "mum_bandra", 1),  ("vb_mum_ahm", "mum_borivali", 2),
    ("vb_mum_ahm", "ahm_kalupur", 3), ("vb_mum_ahm", "ahm_gift_city", 4),

    ("vb_blr_chn", "blr_majestic", 1),("vb_blr_chn", "blr_whitefield", 2),
    ("vb_blr_chn", "chn_central", 3),

    ("vb_blr_hyd", "blr_majestic", 1),("vb_blr_hyd", "hyd_secunderabad", 2),

    ("vb_chn_koc", "chn_central", 1), ("vb_chn_koc", "cbe_junction", 2),
    ("vb_chn_koc", "koc_aluva", 3),   ("vb_chn_koc", "koc_mg_road", 4),

    ("vb_kol_var", "kol_howrah", 1),  ("vb_kol_var", "var_junction", 2),
]

# ──────────────────────────────────────────────────────────────────────────────
#  CONNECTED_TO EDGES (from, to, line_id, line_type, line_color, travel_time_min, distance_km)
# ──────────────────────────────────────────────────────────────────────────────

CONNECTIONS = [
    # ── Delhi Yellow Line ──
    ("del_kashmere_gt", "del_chandni_ck", "del_yellow", "metro", "#F59E0B", 3, 1.4),
    ("del_chandni_ck",  "del_ndls",       "del_yellow", "metro", "#F59E0B", 3, 1.7),
    ("del_ndls",        "del_rajiv_chowk","del_yellow", "metro", "#F59E0B", 2, 1.1),
    ("del_rajiv_chowk", "del_central_sec","del_yellow", "metro", "#F59E0B", 4, 2.2),
    ("del_central_sec", "del_aiims",      "del_yellow", "metro", "#F59E0B", 6, 5.1),
    ("del_aiims",       "del_hauz_khas",  "del_yellow", "metro", "#F59E0B", 4, 3.2),
    ("del_hauz_khas",   "del_iffco_chowk","del_yellow", "metro", "#F59E0B", 18, 16.5),
    ("del_iffco_chowk", "del_cyber_city", "del_yellow", "metro", "#F59E0B", 5, 3.8),

    # ── Delhi Blue Line ──
    ("del_dwarka_sec21","del_rajiv_chowk","del_blue",   "metro", "#3B82F6", 24, 21.0),
    ("del_rajiv_chowk", "del_botanical_g","del_blue",   "metro", "#3B82F6", 18, 15.2),
    ("del_botanical_g", "del_noida_sec62","del_blue",   "metro", "#3B82F6", 10, 8.4),

    # ── Delhi Magenta Line ──
    ("del_botanical_g", "del_hauz_khas",  "del_magenta","metro", "#EC4899", 16, 13.5),
    ("del_hauz_khas",   "del_airport_t3", "del_magenta","metro", "#EC4899", 14, 12.1),
    ("del_airport_t3",  "del_dwarka_sec21","del_magenta","metro","#EC4899", 6, 4.3),

    # ── Delhi Airport Express ──
    ("del_ndls",        "del_airport_t3", "del_airport","metro", "#F97316", 19, 22.7),

    # ── Mumbai Western Railway ──
    ("mum_churchgate",  "mum_dadar",      "mum_wr",     "suburban","#EF4444", 16, 10.5),
    ("mum_dadar",       "mum_bandra",     "mum_wr",     "suburban","#EF4444", 6, 4.2),
    ("mum_bandra",      "mum_andheri",    "mum_wr",     "suburban","#EF4444", 9, 6.8),
    ("mum_andheri",     "mum_borivali",   "mum_wr",     "suburban","#EF4444", 15, 12.4),

    # ── Mumbai Central Railway ──
    ("mum_csmt",        "mum_dadar",      "mum_cr",     "suburban","#0284C7", 14, 9.0),
    ("mum_dadar",       "mum_kurla",      "mum_cr",     "suburban","#0284C7", 8, 5.2),
    ("mum_kurla",       "mum_ghatkopar",  "mum_cr",     "suburban","#0284C7", 5, 3.8),
    ("mum_ghatkopar",   "mum_thane",      "mum_cr",     "suburban","#0284C7", 16, 14.1),

    # ── Mumbai Metro 1 ──
    ("mum_andheri",     "mum_airport",    "mum_m1",     "metro", "#10B981", 6, 3.9),
    ("mum_airport",     "mum_ghatkopar",  "mum_m1",     "metro", "#10B981", 9, 6.2),

    # ── Mumbai Harbour Line ──
    ("mum_csmt",        "mum_kurla",      "mum_harbour","suburban","#8B5CF6", 22, 14.5),
    ("mum_kurla",       "mum_navi_mumbai","mum_harbour","suburban","#8B5CF6", 18, 16.0),

    # ── Bengaluru Purple Line ──
    ("blr_majestic",    "blr_mg_road",    "blr_purple", "metro", "#9333EA", 7, 4.5),
    ("blr_mg_road",     "blr_indiranagar","blr_purple", "metro", "#9333EA", 6, 3.8),
    ("blr_indiranagar", "blr_whitefield", "blr_purple", "metro", "#9333EA", 20, 15.2),

    # ── Bengaluru Green Line ──
    ("blr_yeshwanthpur","blr_majestic",   "blr_green",  "metro", "#16A34A", 12, 7.8),
    ("blr_majestic",    "blr_jayanagar",  "blr_green",  "metro", "#16A34A", 10, 6.2),
    ("blr_jayanagar",   "blr_silk_board", "blr_green",  "metro", "#16A34A", 8, 5.1),

    # ── Bengaluru Tech Corridor ──
    ("blr_silk_board",  "blr_electronic_c","blr_silk_m","metro", "#E11D48", 14, 10.8),

    # ── Hyderabad Red & Blue Lines ──
    ("hyd_secunderabad","hyd_ameerpet",   "hyd_red",    "metro", "#DC2626", 11, 7.2),
    ("hyd_ameerpet",    "hyd_mgbs",       "hyd_red",    "metro", "#DC2626", 12, 8.4),
    ("hyd_hitec_city",  "hyd_jubilee_hills","hyd_blue", "metro", "#2563EB", 7, 4.6),
    ("hyd_jubilee_hills","hyd_ameerpet",  "hyd_blue",   "metro", "#2563EB", 8, 5.3),
    ("hyd_hitec_city",  "hyd_gachibowli", "hyd_blue",   "metro", "#2563EB", 6, 4.1),

    # ── Kolkata Underwater & Blue Line ──
    ("kol_howrah",      "kol_esplanade",  "kol_green",  "metro", "#059669", 6, 4.8),
    ("kol_esplanade",   "kol_sealdah",    "kol_green",  "metro", "#059669", 5, 2.5),
    ("kol_sealdah",     "kol_salt_lake_v","kol_green",  "metro", "#059669", 14, 8.9),
    ("kol_dum_dum",     "kol_esplanade",  "kol_blue",   "metro", "#0284C7", 18, 12.0),
    ("kol_esplanade",   "kol_park_street","kol_blue",   "metro", "#0284C7", 3, 1.6),

    # ── Chennai Blue & Green ──
    ("chn_central",     "chn_t_nagar",    "chn_blue",   "metro", "#38BDF8", 12, 7.5),
    ("chn_t_nagar",     "chn_guindy",     "chn_blue",   "metro", "#38BDF8", 7, 4.2),
    ("chn_guindy",      "chn_airport",    "chn_blue",   "metro", "#38BDF8", 9, 6.1),
    ("chn_central",     "chn_egmore",     "chn_green",  "metro", "#22C55E", 4, 2.0),
    ("chn_egmore",      "chn_koyambedu",  "chn_green",  "metro", "#22C55E", 11, 7.8),

    # ── Pune Metro ──
    ("pun_vanaz",       "pun_shivajinagar","pun_metro1","metro", "#A855F7", 12, 7.9),
    ("pun_shivajinagar","pun_station",    "pun_metro1", "metro", "#A855F7", 6, 3.2),
    ("pun_station",     "pun_swargate",   "pun_metro1", "metro", "#A855F7", 8, 4.5),
    ("pun_shivajinagar","pun_hinjawadi",  "pun_metro1", "metro", "#A855F7", 22, 16.5),

    # ── Ahmedabad Metro ──
    ("ahm_thaltej",     "ahm_kalupur",    "ahm_metro",  "metro", "#F43F5E", 16, 11.2),
    ("ahm_kalupur",     "ahm_gift_city",  "ahm_metro",  "metro", "#F43F5E", 20, 18.0),

    # ── Jaipur Metro ──
    ("jai_station",     "jai_chandpole",  "vb_del_jai", "metro", "#6366F1", 5, 2.8),

    # ── High Speed & Vande Bharat Express Links (Inter-City Interchanges) ──
    ("del_ndls",        "del_cyber_city", "vb_del_jai", "high_speed","#6366F1", 28, 28.0),
    ("del_cyber_city",  "jai_station",    "vb_del_jai", "high_speed","#6366F1", 175, 238.0),

    ("del_ndls",        "agr_cantt",      "vb_del_var", "high_speed","#8B5CF6", 95, 188.0),
    ("agr_cantt",       "luc_charbagh",   "vb_del_var", "high_speed","#8B5CF6", 180, 315.0),
    ("luc_charbagh",    "var_junction",   "vb_del_var", "high_speed","#8B5CF6", 195, 290.0),
    ("var_junction",    "kol_howrah",     "vb_kol_var", "high_speed","#84CC16", 360, 680.0),

    ("del_ndls",        "chd_junction",   "vb_del_chd", "high_speed","#14B8A6", 170, 245.0),

    # Mumbai - Pune High Speed Corridor
    ("mum_dadar",       "pun_shivajinagar","vb_mum_pun","high_speed","#F59E0B", 160, 165.0),
    ("mum_thane",       "pun_shivajinagar","vb_mum_pun","high_speed","#F59E0B", 145, 148.0),

    # Mumbai - Ahmedabad Bullet Train Corridor
    ("mum_bandra",      "mum_borivali",   "vb_mum_ahm", "high_speed","#06D6A0", 12, 18.0),
    ("mum_borivali",    "ahm_kalupur",    "vb_mum_ahm", "high_speed","#06D6A0", 160, 485.0),
    ("ahm_kalupur",     "jai_station",    "vb_del_mum", "high_speed","#E11D48", 290, 620.0),

    # Bengaluru - Chennai Vande Bharat
    ("blr_majestic",    "blr_whitefield", "vb_blr_chn", "high_speed","#3B82F6", 20, 24.0),
    ("blr_whitefield",  "chn_central",    "vb_blr_chn", "high_speed","#3B82F6", 230, 335.0),

    # Bengaluru - Hyderabad Vande Bharat
    ("blr_majestic",    "hyd_secunderabad","vb_blr_hyd","high_speed","#10B981", 420, 570.0),

    # Chennai - Coimbatore - Kochi Vande Bharat
    ("chn_central",     "cbe_junction",   "vb_chn_koc", "high_speed","#EC4899", 320, 495.0),
    ("cbe_junction",    "koc_aluva",      "vb_chn_koc", "high_speed","#EC4899", 130, 175.0),
    ("koc_aluva",       "koc_mg_road",    "vb_chn_koc", "high_speed","#EC4899", 25, 20.0),
]

# ──────────────────────────────────────────────────────────────────────────────
#  SEED EXECUTION
# ──────────────────────────────────────────────────────────────────────────────

def create_constraints(tx):
    tx.run("CREATE CONSTRAINT station_id IF NOT EXISTS FOR (s:Station) REQUIRE s.id IS UNIQUE")
    tx.run("CREATE CONSTRAINT line_id    IF NOT EXISTS FOR (l:Line)    REQUIRE l.id IS UNIQUE")


def load_stations(tx, stations):
    for s in stations:
        tx.run(
            """
            MERGE (s:Station {id: $id})
            SET s.name = $name,
                s.city = $city,
                s.zone = $zone,
                s.lat  = $lat,
                s.lon  = $lon
            """,
            id=s[0], name=s[1], city=s[2], zone=s[3], lat=s[4], lon=s[5],
        )


def load_lines(tx, lines):
    for l in lines:
        tx.run(
            """
            MERGE (l:Line {id: $id})
            SET l.name  = $name,
                l.type  = $type,
                l.color = $color
            """,
            id=l[0], name=l[1], type=l[2], color=l[3],
        )


def load_line_stops(tx, stops):
    for stop in stops:
        tx.run(
            """
            MATCH (l:Line {id: $line_id})
            MATCH (s:Station {id: $station_id})
            MERGE (l)-[r:STOPS_AT]->(s)
            SET r.order = $order
            """,
            line_id=stop[0], station_id=stop[1], order=stop[2],
        )


def load_connections(tx, connections):
    for c in connections:
        tx.run(
            """
            MATCH (a:Station {id: $from_id})
            MATCH (b:Station {id: $to_id})
            MERGE (a)-[r:CONNECTED_TO {line: $line}]->(b)
            SET r.line_type   = $line_type,
                r.line_color  = $line_color,
                r.travel_time = $travel_time,
                r.distance    = $distance
            MERGE (b)-[r2:CONNECTED_TO {line: $line}]->(a)
            SET r2.line_type   = $line_type,
                r2.line_color  = $line_color,
                r2.travel_time = $travel_time,
                r2.distance    = $distance
            """,
            from_id=c[0], to_id=c[1], line=c[2],
            line_type=c[3], line_color=c[4],
            travel_time=c[5], distance=c[6],
        )


def main():
    print("[*] Connecting to CognoDB Cloud...")
    driver = GraphDatabase.driver(URI, auth=(USER, PASSWORD))
    try:
        driver.verify_connectivity()
        print("[+] Connected successfully!")
    except Exception as e:
        print(f"[-] Connection failed: {e}")
        driver.close()
        sys.exit(1)

    with driver.session() as session:
        print("[*] Ensuring unique constraints...")
        session.execute_write(create_constraints)

        print(f"[*] Seeding {len(STATIONS)} All-India Stations...")
        session.execute_write(load_stations, STATIONS)

        print(f"[*] Seeding {len(LINES)} Transit Corridors...")
        session.execute_write(load_lines, LINES)

        print(f"[*] Seeding {len(LINE_STOPS)} Line-Stop Relationships...")
        session.execute_write(load_line_stops, LINE_STOPS)

        print(f"[*] Seeding {len(CONNECTIONS)} Bidirectional Connections...")
        session.execute_write(load_connections, CONNECTIONS)

        # Verification Stats
        res = session.run(
            """
            MATCH (s:Station) WITH count(s) AS st
            MATCH (l:Line)    WITH st, count(l) AS li
            MATCH ()-[r:CONNECTED_TO]->() WITH st, li, count(r) AS co
            RETURN st, li, co
            """
        ).single()

        print("\n[+] All-India Graph Seed Complete!")
        print(f"    Total Stations  : {res['st']}")
        print(f"    Total Lines     : {res['li']}")
        print(f"    Total Edges     : {res['co']}")

    driver.close()


if __name__ == "__main__":
    main()
