import os
import json
import random
import datetime
from PIL import Image, ImageDraw, ImageFont, ImageFilter

def generate_synthetic_dataset(num_samples=20, output_dir='synthetic_dataset'):
    images_dir = os.path.join(output_dir, 'images')
    ann_dir = os.path.join(output_dir, 'annotations')
    os.makedirs(images_dir, exist_ok=True)
    os.makedirs(ann_dir, exist_ok=True)

    allowed_units = ['g', 'kg', 'ml', 'L']
    illegal_units = ['gms', 'ltrs', 'kgs']
    
    cities = ['Mumbai, Maharashtra', 'Bengaluru, Karnataka', 'New Delhi, Delhi', 'Hyderabad, Telangana']

    print(f'Generating {num_samples} annotated synthetic packaging samples...')

    for i in range(num_samples):
        img_id = f'SYN_{i:03d}'
        img_width, img_height = 800, 500
        
        # Packaging background (subtle cardboard/plastic tint)
        bg_color = (random.randint(240, 255), random.randint(240, 255), random.randint(235, 250))
        img = Image.new('RGB', (img_width, img_height), color=bg_color)
        draw = ImageDraw.Draw(img)

        # Decide if this sample will be intentionally compliant or violating
        has_violations = random.choice([True, False])
        violations = []

        # Parameters
        mrp = round(random.uniform(20.0, 650.0), 2)
        net_qty = random.choice([50, 100, 200, 500, 1000])
        
        if has_violations:
            # Pick a specific violation to inject
            violation_type = random.choice(['unit_violation', 'missing_taxes', 'usp_missing'])
            if violation_type == 'unit_violation':
                unit = random.choice(illegal_units)
                violations.append({
                    'rule_code': 'R6(1)(c)',
                    'statutory_reference': 'Rule 6(1)(c) of LMPC Rules 2011',
                    'description': f'Non-standard measurement unit used: {unit}'
                })
            else:
                unit = random.choice(allowed_units)

            if violation_type == 'missing_taxes':
                mrp_str = f'MRP: Rs. {mrp}' # Missing 'Inclusive of all taxes'
                violations.append({
                    'rule_code': 'R6(1)(e)',
                    'statutory_reference': 'Rule 6(1)(e) of LMPC Rules 2011',
                    'description': 'Mandatory phrase "Inclusive of all taxes" omitted'
                })
            else:
                mrp_str = f'MRP: Rs. {mrp} (Inclusive of all taxes)'

            if violation_type == 'usp_missing':
                usp_str = None
                violations.append({
                    'rule_code': 'R6(11)',
                    'statutory_reference': 'Rule 6(11) (2022 Amendment)',
                    'description': 'Unit Sale Price mandatory post-Oct 2022 was omitted'
                })
            else:
                usp_val = round(mrp / net_qty, 2)
                usp_str = f'Unit Sale Price: Rs. {usp_val:.2f}/{unit}'
        else:
            unit = random.choice(allowed_units)
            mrp_str = f'MRP: Rs. {mrp} (Inclusive of all taxes)'
            usp_val = round(mrp / net_qty, 2)
            usp_str = f'Unit Sale Price: Rs. {usp_val:.2f}/{unit}'

        mfg_date = datetime.date(2023, random.randint(1, 12), random.randint(1, 28))
        mfg_fmt = mfg_date.strftime("%m/%Y"); mfg_str = f"Mfg Date: {mfg_fmt}"

        city = random.choice(cities)
        mfr_name = f'Pinnacle Foods Pvt Ltd'
        mfr_address = f'Plot {random.randint(10, 99)}, Sector 4, {city}'
        consumer_care = f'Consumer Care: 1800-890-4422 | support@pinnacle.in'

        # Layout elements on label
        fields_to_render = [
            ('Generic_Name', f'Generic Name: Roasted Cashews', 30),
            ('NetQty_Area', f'Net Quantity: {net_qty} {unit}', 70),
            ('MRP_Area', mrp_str, 110),
            ('MfgDate_Area', mfg_str, 150),
            ('Address_Area', f'Mfd by: {mfr_name}, {mfr_address}', 190),
            ('ConsumerCare_Area', consumer_care, 230)
        ]
        if usp_str:
            fields_to_render.insert(3, ('USP_Area', usp_str, 130))

        bboxes = []
        for label, text_content, y in fields_to_render:
            x = 40
            # Approximate bounding box (10px height, 8px per char)
            box = [x, y - 2, x + len(text_content) * 9, y + 22]
            draw.rectangle(box, outline=(220, 220, 220), width=1)
            draw.text((x, y), text_content, fill=(20, 20, 20))
            bboxes.append({
                'label': label,
                'bbox_xyxy': box,
                'transcription': text_content
            })

        # Add decorative border simulating packaging boundary (PDP)
        pdp_box = [20, 10, img_width - 20, img_height - 20]
        draw.rectangle(pdp_box, outline=(80, 80, 80), width=2)
        bboxes.insert(0, {
            'label': 'PDP',
            'bbox_xyxy': pdp_box,
            'transcription': 'Principal Display Panel'
        })

        # Optical noise augmentation
        if random.choice([True, False]):
            img = img.filter(ImageFilter.GaussianBlur(radius=random.uniform(0.3, 1.0)))

        # Save image
        img_filename = f'{img_id}.png'
        img.save(os.path.join(images_dir, img_filename))

        # Save ground truth JSON
        overall_status = 'FAIL' if violations else 'PASS'
        annotation = {
            'image_id': img_id,
            'metadata': {
                'packaging_type': 'carton',
                'capture_angle': 'front_pdp',
                'has_reference_marker': False
            },
            'bounding_boxes': bboxes,
            'declarations': {
                'manufacturer_name': mfr_name,
                'manufacturer_address': mfr_address,
                'generic_name': 'Roasted Cashews',
                'net_quantity_value': net_qty,
                'net_quantity_unit': unit,
                'mfg_month_year': mfg_date.strftime('%m/%Y'),
                'mrp_value': mrp,
                'unit_sale_price': round(mrp / net_qty, 2) if usp_str else None
            },
            'compliance_ground_truth': {
                'overall_status': overall_status,
                'violations': violations
            }
        }

        with open(os.path.join(ann_dir, f'{img_id}.json'), 'w') as f:
            json.dump(annotation, f, indent=2)

    print(f'Successfully generated {num_samples} images and ground truth annotations in {output_dir}/')

if __name__ == '__main__':
    generate_synthetic_dataset()
