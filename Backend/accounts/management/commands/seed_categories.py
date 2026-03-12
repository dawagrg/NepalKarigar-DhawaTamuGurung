"""
Django management command to seed initial service categories and sub-services.

Usage:
    python manage.py seed_categories

Place this file at:
    Backend/accounts/management/commands/seed_categories.py

Make sure the directory structure exists:
    Backend/accounts/management/__init__.py
    Backend/accounts/management/commands/__init__.py
    Backend/accounts/management/commands/seed_categories.py
"""

from django.core.management.base import BaseCommand
from django.apps import apps
ServiceCategory = apps.get_model('accounts', 'ServiceCategory')
SubService      = apps.get_model('accounts', 'SubService')


SEED_DATA = [
    {
        "name": "Electrical",
        "icon": "⚡",
        "description": "Wiring, installation, repair and maintenance of electrical systems.",
        "sub_services": [
            ("Wiring & Rewiring",       800),
            ("Fan Installation",        500),
            ("Light Fixture Setup",     400),
            ("Circuit Breaker Repair",  700),
            ("Solar Panel Setup",      2500),
            ("CCTV Installation",      1200),
        ],
    },
    {
        "name": "Plumbing",
        "icon": "🔧",
        "description": "Water supply, drainage, pipe fitting and sanitation work.",
        "sub_services": [
            ("Pipe Fitting",            700),
            ("Tap/Faucet Repair",       400),
            ("Toilet Installation",    1000),
            ("Water Tank Cleaning",    1200),
            ("Drain Unclogging",        600),
            ("Shower Setup",            800),
        ],
    },
    {
        "name": "Carpentry",
        "icon": "🪚",
        "description": "Furniture making, door/window fitting, and wood repair.",
        "sub_services": [
            ("Door/Window Fitting",    1200),
            ("Furniture Repair",        800),
            ("Custom Furniture",       3000),
            ("Ceiling Work",           1500),
            ("Cabinet Making",         2500),
        ],
    },
    {
        "name": "Painting",
        "icon": "🎨",
        "description": "Interior and exterior painting for homes and offices.",
        "sub_services": [
            ("Interior Wall Painting",  800),
            ("Exterior Painting",      1000),
            ("Texture Painting",       1500),
            ("Waterproofing Paint",    1200),
        ],
    },
    {
        "name": "Masonry",
        "icon": "🧱",
        "description": "Brickwork, plastering, tiling and construction support.",
        "sub_services": [
            ("Tile/Marble Fitting",    1000),
            ("Plastering",             1200),
            ("Brickwork",              1500),
            ("Waterproofing",          2000),
        ],
    },
    {
        "name": "Cleaning",
        "icon": "🧹",
        "description": "Deep cleaning for homes, offices and commercial spaces.",
        "sub_services": [
            ("Home Deep Cleaning",     2000),
            ("Office Cleaning",        3000),
            ("Sofa/Carpet Cleaning",   1500),
            ("Kitchen Cleaning",       1200),
            ("Post-Construction Cleanup", 3500),
        ],
    },
    {
        "name": "Landscaping",
        "icon": "🌿",
        "description": "Garden design, lawn maintenance and plant care.",
        "sub_services": [
            ("Lawn Mowing",             600),
            ("Garden Design",          2000),
            ("Tree Trimming",           800),
            ("Plant Setup",            1200),
        ],
    },
    {
        "name": "IT / Tech",
        "icon": "💻",
        "description": "Computer repair, networking, software installation and support.",
        "sub_services": [
            ("PC/Laptop Repair",       1000),
            ("Networking Setup",       1500),
            ("Software Installation",   500),
            ("CCTV & Security",        2000),
            ("Printer Setup",           600),
        ],
    },
    {
        "name": "Auto Repair",
        "icon": "🚗",
        "description": "Vehicle servicing, repair and maintenance.",
        "sub_services": [
            ("Oil Change",              600),
            ("Brake Repair",           1500),
            ("Tyre Change",             500),
            ("Engine Diagnostics",     2000),
        ],
    },
    {
        "name": "Tailoring",
        "icon": "🧵",
        "description": "Custom stitching, alterations and clothing repair.",
        "sub_services": [
            ("Dress Stitching",        1000),
            ("Alteration",              400),
            ("Uniform Stitching",      1200),
        ],
    },
]


class Command(BaseCommand):
    help = "Seed initial service categories and sub-services"

    def handle(self, *args, **options):
        created_cats = 0
        created_subs = 0

        for data in SEED_DATA:
            cat, cat_created = ServiceCategory.objects.get_or_create(
                name=data["name"],
                defaults={
                    "icon":        data["icon"],
                    "description": data["description"],
                    "is_active":   True,
                }
            )
            if cat_created:
                created_cats += 1
                self.stdout.write(f"  ✓ Created category: {cat.name}")
            else:
                self.stdout.write(f"  ~ Already exists: {cat.name}")

            for sub_name, base_price in data["sub_services"]:
                sub, sub_created = SubService.objects.get_or_create(
                    category=cat,
                    name=sub_name,
                    defaults={"base_price": base_price, "is_active": True}
                )
                if sub_created:
                    created_subs += 1

        self.stdout.write(self.style.SUCCESS(
            f"\n✅ Done! Created {created_cats} categories and {created_subs} sub-services."
        ))