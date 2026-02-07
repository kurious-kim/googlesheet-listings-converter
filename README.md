# Google Sheet Listings Converter

Google Sheets 기반 자동차 부품 재고 관리를 위한 데이터 변환 도구 모음입니다.

## 개요

```
[Apps Script - Google Sheets 내에서 실행]
Listings K열  ──  syncListingsToParts()    ──►  Parts 시트 (개별 행 생성)
Parts 시트    ──  updateListingsParts()    ──►  Listings K열 (조합 문자열)

[Python - 로컬에서 실행 (레거시)]
Listings.csv  ──  convert_listings.py      ──►  parts_for_googlesheets.csv
```

## 파일 구조

```
googlesheet-listings-converter/
├── parts-to-listings.gs         # [Apps Script] Listings ↔ Parts 양방향 동기화
├── convert_listings.py          # [Python] Listings → Parts 변환 (레거시)
├── .gitignore
└── README.md
```

> CSV 데이터 파일(`Listings.csv`, `parts_for_googlesheets.csv`)은 `.gitignore`로 제외되어 있습니다.

## Google Sheets 시트 구조

### Listings 시트

| 열 | A | B | C | D | E | F | G | H | I | J | K | L |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 내용 | Item No | Title | 구매가 | 배송비 | 판매가 | 배송옵션 | 총판매가 | 광고비 | 마진 | 마진율 | Parts | 특이사항 |

### Parts 시트

| 열 | A | B | C | D | E | F |
|---|---|---|---|---|---|---|
| 내용 | Item No | Part No | Quantity | 호환부품 | 브랜드 | 재고 |

- D(호환부품), F(재고)는 수동 입력 데이터 → 동기화 시 보존됨

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

- Parts(F), 구매가(J), 배송비(K)는 Item No 기준 Listings에서 VLOOKUP

### 직원 시트 (다솜, 예은)

- Listings와 동일한 열 구조 (A~L)
- 직원이 신규 리스팅 입력 후 Listings로 수동 복사/붙여넣기

## parts-to-listings.gs (Apps Script)

스프레드시트를 열면 **Parts Management** 메뉴가 자동으로 추가됩니다.

### syncListingsToParts() — Listings → Parts

Listings K열의 Parts 문자열을 파싱하여 Parts 시트에 개별 행으로 생성합니다.

| 동작 | 설명 |
|---|---|
| 파싱 | `[IN STOCK] [Brand] PartA*2/PartB` → Item No, Part No, Qty, Brand 추출 |
| 보존 | 기존 Parts의 호환부품(D열)과 재고(F열)는 유지 |
| 스킵 | K열이 비어있거나 `OUT OF STOCK`인 행은 건드리지 않음 |
| 텍스트 | Item No, Part No를 텍스트 형식으로 저장 (숫자 변환 방지) |

### updateListingsParts() — Parts → Listings

Parts 시트의 개별 파트 데이터를 Listings K열에 조합 문자열로 기록합니다.

| Parts 시트 상태 | 출력 (Listings K열) |
|---|---|
| 재고 있음 | `[IN STOCK] [Brand] PartA*2/PartB` |
| 재고 = 0 | `OUT OF STOCK` |

### 사용법

1. Google Sheets의 Apps Script 편집기에 코드를 붙여넣기
2. 스프레드시트를 새로고침하면 **Parts Management** 메뉴 표시
3. 메뉴에서 원하는 기능 선택

### 주의사항

- `getDisplayValues()`로 데이터를 읽어 텍스트 형식 보존
- `setNumberFormat('@')` → `setValues()` 순서로 써야 숫자 변환 방지
- 시트 간 Item No 매칭 시 `String().trim()`으로 타입 통일

## convert_listings.py (레거시)

> `syncListingsToParts()`로 대체되었습니다. 대량 데이터 초기 마이그레이션 시에만 사용합니다.

### 사용법

```bash
python convert_listings.py
```

`Listings.csv` 파일이 스크립트와 같은 디렉토리에 있어야 합니다.

## 요구사항

- **parts-to-listings.gs**: Google Sheets + Apps Script 환경
- **convert_listings.py**: Python 3.10+ (외부 패키지 불필요)
