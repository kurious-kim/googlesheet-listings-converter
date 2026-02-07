# Google Sheet Listings Converter

Google Sheets 기반 자동차 부품 재고 관리를 위한 데이터 변환 도구 모음입니다.

## 개요

두 가지 변환 도구로 구성되어 있으며, 서로 반대 방향의 변환을 수행합니다.

```
Parts 시트 (개별 행)  ──  parts-to-listings.gs  ──►  Listings 시트 K열 (조합 문자열)
Listings.csv (조합 문자열)  ──  convert_listings.py  ──►  parts_for_googlesheets.csv (개별 행)
```

## 파일 구조

```
googlesheet-listings-converter/
├── convert_listings.py          # [Python] Listings → Parts 변환 스크립트
├── parts-to-listings.gs         # [Apps Script] Parts → Listings 변환 스크립트
├── Listings.csv                 # 입력 파일 (Item No, Parts)
├── parts_for_googlesheets.csv   # 출력 파일 (Item No, Part, Quantity)
└── README.md
```

## convert_listings.py

Listings CSV의 Parts 문자열을 파싱하여 Google Sheets에서 활용하기 편한 long format CSV로 변환합니다.

### 변환 예시

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

### 사용법

```bash
python convert_listings.py
```

`Listings.csv` 파일이 스크립트와 같은 디렉토리에 있어야 합니다.

## parts-to-listings.gs

Google Apps Script로, Google Sheets 내에서 Parts 시트의 개별 파트 데이터를 Listings 시트의 K열에 조합 문자열로 기록합니다.

### Google Sheets 시트 구조

**Parts 시트** (입력)

| A: Item No | B: Part No | C: Quantity | D: - | E: Brand | F: Stock |
|---|---|---|---|---|---|

**Listings 시트** (출력 - K열)

| 형식 | 예시 |
|---|---|
| `[IN STOCK] [Brand] PartA*2/PartB` | `[IN STOCK] [Hyundai] 373003C531*2/371804D010` |
| `OUT OF STOCK` | 재고(F열)가 0인 경우 |

### 사용법

Google Sheets의 Apps Script 편집기에 코드를 붙여넣고 `updateListingsParts()` 함수를 실행합니다.

## 요구사항

- **convert_listings.py**: Python 3.10+ (외부 패키지 불필요)
- **parts-to-listings.gs**: Google Sheets + Apps Script 환경
