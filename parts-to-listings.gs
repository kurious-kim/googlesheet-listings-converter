/**
 * 메뉴 등록
 */
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('Parts Management')
    .addItem('Listings → Parts 동기화', 'syncListingsToParts')
    .addItem('Parts → Listings 업데이트', 'updateListingsParts')
    .addToUi();
}

/**
 * Listings K열의 Parts 문자열을 파싱하여 Parts 시트에 동기화
 * - 기존 호환부품(D열)과 재고(F열)는 보존
 */
function syncListingsToParts() {
  const ss = SpreadsheetApp.getActive();
  const listings = ss.getSheetByName('Listings');
  const partsSheet = ss.getSheetByName('Parts');

  const lLastRow = listings.getLastRow();
  if (lLastRow < 2) return;

  // 기존 Parts 데이터 읽기
  const pLastRow = partsSheet.getLastRow();
  const existingParts = []; // 전체 기존 데이터
  const preserveMap = {}; // key: "itemNo|partNo" → {호환부품, 재고}

  if (pLastRow >= 2) {
    const pData = partsSheet.getRange(2, 1, pLastRow - 1, 6).getDisplayValues();
    pData.forEach(r => {
      existingParts.push(r);
      const key = r[0].trim() + '|' + r[1].trim();
      preserveMap[key] = {
        호환부품: r[3], // D
        재고: r[5]      // F
      };
    });
  }

  // Listings에서 Item No(A)와 Parts(K) 읽기
  const lData = listings.getRange(2, 1, lLastRow - 1, 12).getValues();

  // 파싱 가능한 Item No 목록과 새 Parts 행 생성
  const processedItemNos = new Set();
  const parsedRows = [];
  let processed = 0;
  let skipped = 0;

  lData.forEach(row => {
    const itemNo = String(row[0]).trim(); // A
    const partsStr = String(row[10]).trim(); // K (index 10)

    if (!itemNo || !partsStr || partsStr === 'OUT OF STOCK') {
      skipped++;
      return;
    }

    const parsed = parsePartsString(partsStr);
    if (parsed.parts.length === 0) {
      skipped++;
      return;
    }

    processedItemNos.add(itemNo);

    parsed.parts.forEach(p => {
      const key = itemNo + '|' + p.partNo;
      const preserved = preserveMap[key] || {};

      parsedRows.push([
        String(itemNo),                  // A: Item No (문자열 강제)
        String(p.partNo),                // B: Part No (문자열 강제)
        String(p.qty),                   // C: Quantity
        preserved.호환부품 || '',          // D: 호환부품 (보존)
        parsed.brand || '',              // E: 브랜드
        preserved.재고 || ''              // F: 재고 (보존)
      ]);
    });

    processed++;
  });

  // 처리 안 된 Item No의 기존 Parts 행은 그대로 유지
  const keptRows = existingParts.filter(r => {
    const itemNo = String(r[0]).trim();
    return !processedItemNos.has(itemNo);
  });

  const allRows = [...keptRows, ...parsedRows];

  // Parts 시트 덮어쓰기 (헤더 유지)
  if (pLastRow >= 2) {
    partsSheet.getRange(2, 1, pLastRow - 1, 6).clear();
  }

  if (allRows.length > 0) {
    const writeRange = partsSheet.getRange(2, 1, allRows.length, 6);
    // 전체를 텍스트 형식으로 설정한 후 값 쓰기 (숫자 변환 방지)
    writeRange.setNumberFormat('@');
    writeRange.setValues(allRows);
  }

  SpreadsheetApp.getUi().alert(
    `Parts 동기화 완료 ✅\n\n처리: ${processed}개 리스팅\n유지: ${keptRows.length}개 행 (기존 보존)\n생성: ${parsedRows.length}개 행\n스킵: ${skipped}개 리스팅`
  );
}

/**
 * Parts 문자열 파싱
 * "[IN STOCK] [Hyundai] 373003C531*2/371804D010" →
 *   { brand: "Hyundai", parts: [{partNo, qty}, ...] }
 */
function parsePartsString(str) {
  let remaining = str.trim();
  let brand = '';

  // [IN STOCK] 제거
  if (remaining.startsWith('[IN STOCK]')) {
    remaining = remaining.substring(10).trim();
  }

  // [Brand] 추출
  const brandMatch = remaining.match(/^\[([^\]]+)\]/);
  if (brandMatch) {
    brand = brandMatch[1].trim();
    remaining = remaining.substring(brandMatch[0].length).trim();
  }

  // Parts 분리: "PartA*2/PartB" → [{partNo, qty}]
  const parts = [];
  remaining.split('/').forEach(segment => {
    segment = segment.trim();
    if (!segment) return;

    const qtyMatch = segment.match(/^(.+)\*(\d+)$/);
    if (qtyMatch) {
      parts.push({ partNo: qtyMatch[1].trim(), qty: parseInt(qtyMatch[2], 10) });
    } else {
      parts.push({ partNo: segment, qty: 1 });
    }
  });

  return { brand, parts };
}

/**
 * Parts → Listings 전체 업데이트
 */
function updateListingsParts() {
  const ss = SpreadsheetApp.getActive();
  const listings = ss.getSheetByName('Listings');
  const parts = ss.getSheetByName('Parts');

  const lLastRow = listings.getLastRow();
  if (lLastRow < 2) return;

  // Listings: A=Item No, K=Parts
  const lItemCol = 1; // A
  const lPartsCol = 11; // K

  // Parts: A~F
  const pData = parts.getRange(2, 1, parts.getLastRow() - 1, 6).getValues();

  // Item No 기준 Parts 그룹핑
  const partsMap = {};
  pData.forEach(r => {
    const itemNo = r[0]; // A
    if (!itemNo) return;
    if (!partsMap[itemNo]) partsMap[itemNo] = [];
    partsMap[itemNo].push(r);
  });

  const lData = listings.getRange(2, 1, lLastRow - 1, listings.getLastColumn()).getValues();

  lData.forEach(row => {
    const itemNo = row[lItemCol - 1];
    if (!itemNo || !partsMap[itemNo]) {
      row[lPartsCol - 1] = '';
      return;
    }

    const rows = partsMap[itemNo];

    // 1️⃣ OUT OF STOCK (재고 = 0)
    const hasZeroStock = rows.some(r => String(r[5]).trim() === '0'); // F
    if (hasZeroStock) {
      row[lPartsCol - 1] = 'OUT OF STOCK';
      return;
    }

    let result = '';

    // 2️⃣ IN STOCK (빈칸 아님 & 0 아님)
    const hasInStock = rows.some(r => {
      const stock = String(r[5]).trim();
      return stock !== '' && stock !== '0';
    });
    if (hasInStock) {
      result += '[IN STOCK] ';
    }

    // 3️⃣ 브랜드 (첫 번째 값)
    const brandRow = rows.find(r => String(r[4]).trim() !== ''); // E
    if (brandRow) {
      result += `[${String(brandRow[4]).trim()}] `;
    }

    // 4️⃣ Parts 문자열
    const partsText = rows.map(r => {
      const partNo = r[1]; // B
      const qty = Number(r[2]); // C
      if (!qty || qty === 1) return partNo;
      return `${partNo}*${qty}`;
    });

    row[lPartsCol - 1] = (result + partsText.join('/')).trim();
  });

  listings
    .getRange(2, lPartsCol, lData.length, 1)
    .setValues(lData.map(r => [r[lPartsCol - 1]]));

  SpreadsheetApp.getUi().alert('Listings Parts 전체 업데이트 완료 ✅');
}
