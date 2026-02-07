# Google Sheet Listings Converter

Listings CSV 파일의 Parts 컬럼을 파싱하여 Google Sheets에서 활용하기 편한 long format CSV로 변환하는 Python 스크립트입니다.

## 변환 예시

**입력 (`Listings.csv`)**

| Item No | Parts |
|---|---|
| 12345 | TYPE1\*2/TYPE2\*3/TYPE3 |

**출력 (`parts_for_googlesheets.csv`)**

| Item No | Part | Quantity |
|---|---|---|
| 12345 | TYPE1 | 2 |
| 12345 | TYPE2 | 3 |
| 12345 | TYPE3 | 1 |

- `/`로 구분된 파트를 개별 행으로 분리
- `*숫자` 패턴에서 수량 추출 (없으면 기본값 1)

## 사용법

```bash
python convert_listings.py
```

`Listings.csv` 파일이 스크립트와 같은 디렉토리에 있어야 합니다. 실행 후 `parts_for_googlesheets.csv` 파일이 생성됩니다.

## 파일 구조

```
googlesheet-listings-converter/
├── convert_listings.py          # 변환 스크립트
├── Listings.csv                 # 입력 파일 (Item No, Parts)
├── parts_for_googlesheets.csv   # 출력 파일 (Item No, Part, Quantity)
└── README.md
```

## 요구사항

- Python 3.10+
- 외부 패키지 불필요 (표준 라이브러리만 사용)
