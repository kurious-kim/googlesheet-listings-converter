#!/usr/bin/env python3
"""
Listings.csv 파일을 구글시트에서 활용하기 편한 형태로 변환하는 스크립트
각 파트를 별도 행으로 분리하고, Item No와 수량을 별도 컬럼으로 분리
"""

import csv
import re
from pathlib import Path


def parse_parts(parts_str: str) -> list[tuple[str, int]]:
    """
    Parts 문자열을 파싱하여 (파트명, 수량) 리스트로 반환
    
    Args:
        parts_str: "TYPE1*2/TYPE2*3/TYPE3" 형태의 문자열
        
    Returns:
        [(파트명, 수량), ...] 리스트
    """
    if not parts_str or not parts_str.strip():
        return []
    
    result = []
    parts = parts_str.split('/')
    
    for part in parts:
        part = part.strip()
        if not part:
            continue
        
        # "*숫자" 패턴 확인
        if '*' in part:
            match = re.match(r'^(.+)\*([0-9]+)$', part)
            if match:
                part_name = match.group(1).strip()
                quantity = int(match.group(2))
            else:
                part_name = part
                quantity = 1
        else:
            part_name = part
            quantity = 1
        
        result.append((part_name, quantity))
    
    return result


def convert_to_long_format(input_csv: Path, output_csv: Path):
    """
    넓은 형태의 CSV를 긴 형태(long format)로 변환
    
    입력: Item No, Parts (형식: "TYPE1*2/TYPE2*3")
    출력: Item No, Part, Quantity
    """
    rows_written = 0
    total_parts = 0
    
    with open(input_csv, 'r', encoding='utf-8') as f_in, \
         open(output_csv, 'w', encoding='utf-8', newline='') as f_out:
        
        reader = csv.DictReader(f_in)
        writer = csv.DictWriter(f_out, fieldnames=['Item No', 'Part', 'Quantity'])
        writer.writeheader()
        
        for row in reader:
            item_no = row.get('Item No', '').strip()
            parts_str = row.get('Parts', '').strip()
            
            if not item_no:
                continue
            
            parts = parse_parts(parts_str)
            
            for part_name, quantity in parts:
                writer.writerow({
                    'Item No': item_no,
                    'Part': part_name,
                    'Quantity': quantity
                })
                rows_written += 1
                total_parts += quantity
    
    return rows_written, total_parts


def main():
    base_path = Path(__file__).parent
    input_csv = base_path / 'Listings.csv'
    output_csv = base_path / 'parts_for_googlesheets.csv'
    
    if not input_csv.exists():
        print(f"오류: {input_csv} 파일을 찾을 수 없습니다.")
        return
    
    print("구글시트용 데이터 변환을 시작합니다...")
    print(f"입력 파일: {input_csv}")
    print("-" * 80)
    
    rows_written, total_parts = convert_to_long_format(input_csv, output_csv)
    
    print(f"\n변환 완료:")
    print(f"  출력 파일: {output_csv}")
    print(f"  총 행 수: {rows_written:,}")
    print(f"  총 파트 수량 합계: {total_parts:,}")
    print(f"\n✅ 변환 완료!")


if __name__ == '__main__':
    main()
