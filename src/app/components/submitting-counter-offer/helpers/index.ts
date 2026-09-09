  export function removeDuplicates(goodsArray) {
    if (goodsArray) {
      const uniqueGoodsMap = new Map<
        number,
        { idGoodName: number; goodName: string }
      >();
      for (const good of goodsArray) {
        if (!uniqueGoodsMap.has(good.idGoodName)) {
          uniqueGoodsMap.set(good.idGoodName, {
            idGoodName: good.idGoodName,
            goodName: good.goodName,
          });
        }
      }
      return Array.from(uniqueGoodsMap.values());
    }
  }