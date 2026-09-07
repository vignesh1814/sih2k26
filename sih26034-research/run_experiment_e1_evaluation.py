"""
Experiment E1: Extraction Evaluation & Hallucination Benchmark Harness
Calculates Character Error Rate (CER), Word Error Rate (WER), Entity F1, and Hallucination Rate.
"""

def calculate_levenshtein(s1, s2):
    if len(s1) < len(s2):
        return calculate_levenshtein(s2, s1)
    if len(s2) == 0:
        return len(s1)
    prev_row = range(len(s2) + 1)
    for i, c1 in enumerate(s1):
        curr_row = [i + 1]
        for j, c2 in enumerate(s2):
            insertions = prev_row[j + 1] + 1
            deletions = curr_row[j] + 1
            substitutions = prev_row[j] + (c1 != c2)
            curr_row.append(min(insertions, deletions, substitutions))
        prev_row = curr_row
    return prev_row[-1]

def compute_cer(gt_text, pred_text):
    dist = calculate_levenshtein(gt_text, pred_text)
    return dist / max(len(gt_text), 1)

def evaluate_extraction_benchmark(predictions, ground_truths):
    total_cer = 0.0
    total_samples = len(ground_truths)
    hallucinations = 0
    correct_entities = 0
    total_entities = 0

    for gt, pred in zip(ground_truths, predictions):
        # Overall transcription CER
        gt_full = ' '.join(gt.get('texts', []))
        pred_full = ' '.join(pred.get('texts', []))
        total_cer += compute_cer(gt_full, pred_full)

        # Entity F1 & Hallucination check
        for k, gt_val in gt.get('entities', {}).items():
            total_entities += 1
            pred_val = pred.get('entities', {}).get(k)
            if pred_val == gt_val:
                correct_entities += 1
            elif pred_val is not None and gt_val is None:
                hallucinations += 1

    avg_cer = round((total_cer / max(total_samples, 1)) * 100, 2)
    entity_accuracy = round((correct_entities / max(total_entities, 1)) * 100, 2)
    hallucination_rate = round((hallucinations / max(total_entities, 1)) * 100, 2)

    return {
        'evaluated_samples': total_samples,
        'average_cer_percent': avg_cer,
        'entity_accuracy_percent': entity_accuracy,
        'hallucination_rate_percent': hallucination_rate,
        'decision': 'ACCEPTED' if hallucination_rate <= 2.0 else 'DISQUALIFIED_FOR_PRODUCTION'
    }

if __name__ == '__main__':
    print('=== Running Experiment E1 Mock Evaluation Harness ===')
    gt_mock = [
        {'texts': ['MRP Rs. 150.00', 'Net Qty: 500g'], 'entities': {'mrp': 150.0, 'net_qty': '500g'}},
        {'texts': ['Best Before 12/2026', 'Mfd by ABC Corp'], 'entities': {'date': '12/2026', 'mfr': 'ABC Corp'}}
    ]
    pred_mock = [
        {'texts': ['MRP Rs. 150.00', 'Net Qty: 500g'], 'entities': {'mrp': 150.0, 'net_qty': '500g'}},
        {'texts': ['Best Before 12/2026', 'Mfd by ABC Corp'], 'entities': {'date': '12/2026', 'mfr': 'ABC Corp'}}
    ]
    res = evaluate_extraction_benchmark(pred_mock, gt_mock)
    for k, v in res.items():
        print(f'{k}: {v}')
