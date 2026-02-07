/**
 * Listings 전체 업데이트
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
