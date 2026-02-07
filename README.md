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
├── .gitignore                   # CSV 데이터 파일 등 제외
└── README.md
```

> CSV 데이터 파일(`Listings.csv`, `parts_for_googlesheets.csv`)은 `.gitignore`로 제외되어 있습니다.
> 스크립트 실행 시 로컬에 생성/사용됩니다.

## Google Sheets 시트 구조

### Listings 시트

| 열 | A | B | C | D | E | F | G | H | I | J | K | L |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 내용 | Item No | Title | 구매가 | 배송비 | 판매가 | 배송옵션 | 총판매가 | 광고비 | 마진 | 마진율 | Parts | 특이사항 |

### Parts 시트

| 열 | A | B | C | D | E | F |
|---|---|---|---|---|---|---|
| 내용 | Item No | Part No | Quantity | 호환부품 | 브랜드 | 재고 |

### Orders 시트

| 열 | A | B | C | D | E | F | G | H | I |
|---|---|---|---|---|---|---|---|---|---|
| 내용 | Order Number | Date | Item(=Item No) | Qty | Record | Parts | Title | Username | Country |

| 열 | J | K | L | M | N | O | P | Q |
|---|---|---|---|---|---|---|---|---|
| 내용 | 구매가 | 배송비 | 관세 | Net | 순수익 | 구매 | mag | 특이사항(서명/VIN) |

| 열 | R | S | T | U | V | W~Z |
|---|---|---|---|---|---|---|
| 내용 | 배송 | Tracking | 배송상태 | 도착일 | Record | 수신자 정보 |

- Orders의 **Parts**(F), **구매가**(J), **배송비**(K)는 Item No 기준으로 Listings 시트에서 VLOOKUP으로 가져옵니다.

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

Google Apps Script로, Parts 시트의 개별 파트 데이터를 Listings 시트의 K열(Parts)에 조합 문자열로 기록합니다.

### 출력 형식

| 형식 | 예시 |
|---|---|
| `[IN STOCK] [Brand] PartA*2/PartB` | `[IN STOCK] [Hyundai] 373003C531*2/371804D010` |
| `OUT OF STOCK` | 재고(F열)가 0인 경우 |

### 사용법

Google Sheets의 Apps Script 편집기에 코드를 붙여넣고 `updateListingsParts()` 함수를 실행합니다.

## 요구사항

- **convert_listings.py**: Python 3.10+ (외부 패키지 불필요)
- **parts-to-listings.gs**: Google Sheets + Apps Script 환경
