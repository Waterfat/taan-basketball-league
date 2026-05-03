# Issue #17 Task 9：dragon.json 重複 rulesLink 鍵清理

## 完成項目
- [x] 刪除 public/data/dragon.json line 6 example.com 重複鍵
- [x] 保留真實 Notion URL（line 46）

## 修改檔案
- public/data/dragon.json

## 測試結果

```
$ node -e "console.log(JSON.parse(require('fs').readFileSync('public/data/dragon.json', 'utf8')).rulesLink)"
https://ink-ulna-616.notion.site/1d4a155d96b6809fa811fbbe61f317dd?source=copy_link

$ grep -c '"rulesLink"' public/data/dragon.json
1
```

- JSON parse 成功，無 syntax error
- `rulesLink` 鍵僅剩 1 個，指向實際 Notion 規則頁
