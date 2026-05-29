# 無障礙內文潤飾工具 (Accessibility Tool)

這是一個幫助網站編輯與開發者快速將一般 HTML（或從 Word / Google Docs 複製的內容）轉換為符合 WCAG 2.1 (AA/AAA) 無障礙標準的自動化工具。透過大語言模型（如 Claude 3.5 Sonnet）來進行程式碼清理與語意化修復。

## 近期更新與優化紀錄

為了深入強化網頁的無障礙體驗與程式碼品質，本工具包含了以下核心優化規則：

### 1. 樣式與 CSS 處理防呆
*   **保留重要排版與 `<style>` 標籤**：會完整保留並自動美化獨立的 `<style>` 標籤中的 CSS 語法；對於 HTML 標籤內的 `style="..."` 行內樣式，若判斷具備實質排版意義或符合無障礙規則，亦會予以保留。
*   **色彩對比與焦點樣式補強**：如果樣式中出現對比度過低（不符 WCAG 規範）的文字顏色，或是有 `outline: none` 但缺少 `:focus` 的狀況，將會嘗試修復或提出警告。

### 2. 六大無障礙與結構優化 (Optimization Highlights)
1.  **標題與大綱優化**：不僅嚴格遵守網頁 `h1`~`h6` 的標題階層規範，當遇到被迫降級的原始大標題（或使用粗體 `<p>` 偽作標題的情況），能運用轉換標籤與 CSS 輔助，既保有設計感又能維持語意正確。
2.  **語意化清單 (Semantic Lists)**：手動輸入的偽項目符號（如 `1.`、`2.`、`a.` 等）能被自動轉換為語意化的 `<ol>`、`<ul>` 與 `<li>` 標籤，有助於螢幕報讀軟體正確辨識與讀出清單結構。
3.  **無障礙連結補強**：針對超連結（`<a>`），若為外部或是開新視窗的連結，強制自動補齊 `target="_blank"`、`rel="noopener noreferrer"` 屬性以及適當的 `title` 語音提示，並檢出「點此」等無意義連結文字。
4.  **移除不專業字體與雜亂結構**：強制清除拷貝字面版時常出現的 `Comic Sans MS` 等不適合的字體，並簡化、消除由 Word 等編輯器造成的層層冗餘 `<span>` 標籤嵌套，確保專業度與原始碼可讀性。
5.  **圖片與行動端 RWD 處理**：除了針對圖片移除寫死的寬高並加上響應式樣式 `style="max-width: 100%; height: auto;"` 外，亦會主動清除 `<p>`、`<div>` 等元素不當寫死的固定寬度（如 `px`），全面提升手機橫直向的可讀性。
6.  **表格 RWD 防破版機制**：針對行動裝置最容易破版的大表格，系統會自動在 `<table>` 外層包覆 `<div style="overflow-x: auto;">`，確保在小螢幕上可以順暢橫向滑動閱讀。

### 3. 架構穩定度提升
*   **嚴格 JSON 格式解析限制**：為了解決長篇幅內容或多行 HTML 可能導致的 JSON 報錯（`unterminated string`），已經在系統提示詞中強制要求 AI 將輸出的換行符號轉義為 `\n`，並完美編碼雙引號，大幅提高長文轉換時的穩定性。

### 4. 精準無障礙色彩對比引擎與操作介面優化 (2026-04-02)
*   **前端動態對比度運算 (JS 精準校正)**：由於大語言模型 (LLM) 在計算精確色彩對比度時較易發生幻覺，我們導入了前端程式的強力介入！系統新增了「頁面主體背景色」設定 UI，不僅會將其背景色參數傳遞給 LLM 判斷使用，更在收到資料後，使用 JavaScript 於本機端直接執行精準的 WCAG 相對亮度演算法 (Relative Luminance)。此演算法會考量字體大小 (FontSize) 與粗細 (FontWeight)，並動態加深或調亮不合規的行內文字設定，確保最終產出必定完美符合 4.5:1 (AA)、3:1 (AA 大字體) 或是 7:1 (AAA) 的對比門檻。
*   **動線與操作流暢度升級**：重新編排了操作介面。將頂部 Logo 完美置中，並將「設定背景色、選擇最大標題階層、選擇 AA/AAA 嚴格度」三個核心控制功能，一併下放匯整為一個獨立的操作橫列，置中緊貼於主控面板的上方。這樣的版面設計讓使用者的操作思路更符合「配置參數 ➔ 貼上手邊文檔 ➔ 等待完美結果」的直覺流程。

---

### 5. CSS 與 HTML 結構精準對應修復 (2026-05-29)

本次更新的核心目標：確保 **Call 2 生成的 CSS 規則，行為完全符合 Call 1 輸出的 HTML 元素類型**，解決長期存在的「CSS 樣式與 HTML 結構不對應」問題。

#### 根本原因
Call 2 先前依據 **class 名稱語義**（如看到 `a11y-text-cta` 就推測是按鈕行為）生成 CSS，導致 `<p>` 這類非互動元素被賦予 `cursor: pointer`、`:hover`、`:focus-visible` 等只屬於互動元素的樣式。

#### 修復方案：三層防護

**① Call 1：零例外 class 標記原則**

強化 system prompt 第三部分，明確規定輸入 HTML 中**每一個含有 `style=""` 的元素**，無論是 `<h3>`、`<p>`、`<span>`、`<li>` 還是 `<td>`，都必須同時移除 `style=""` 並加上對應的 `a11y-` class；嚴禁只刪 style 不加 class（會造成樣式靜默消失）。

**② Call 1：語意元素轉換規則**

新增 `span`/`div` → 語意標籤的轉換邏輯：
- `font-weight: bold/700+` → `<strong class="a11y-xxx">`
- `font-style: italic` → `<em class="a11y-xxx">`
- 視覺強調色 → `<mark class="a11y-xxx">` 或 `<strong class="a11y-xxx">`

**③ JavaScript：`classTagMap` 橋接機制**

在兩次 API 呼叫之間，以程式化正規表達式掃描 Call 1 的 HTML 輸出，建立 `Map<className, htmlTag>`（記錄每個 `a11y-` class 的**第一個實際出現的 HTML 元素標籤**），並分類標注：

```js
const interactiveTags = new Set(['a', 'button', 'input', 'select', 'textarea']);
// → 生成 Call 2 的 class 清單，格式如：
// - p.a11y-text-cta（非互動元素，不加 cursor/hover/focus 樣式）
// - a.a11y-link-external（互動元素，須有 :hover 與 :focus-visible）
```

此清單直接傳入 Call 2 的 user message，讓模型依據**元素類型**而非 class 名稱決定 CSS 行為。

**④ Call 2：元素語意對應規則**

在 CSS system prompt 中新增強制約束：
- `<p>`、`<div>`、`<span>`、`<li>`、`<td>`、`<figure>`、`<h3>~<h5>` → **嚴禁** `cursor: pointer`、`:hover` 改變外觀、`:focus-visible`
- `<a>`、`<button>`、`<input>`、`<select>` → **必須** 有 `:hover` 與 `:focus-visible` 樣式

---

### 6. UI UX Pro Max 視覺設計規範整合 (2026-05-29)

依照 [UI UX Pro Max](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill) 設計智能規範（161 條行業推理規則 + 67 種 UI 風格），將以下 9 條視覺標準嵌入 Call 2 的 CSS 生成 system prompt，確保所有輸出的 `<style>` 區塊達到專業 UI/UX 品質：

| # | 規範項目 | 實作要求 |
|---|----------|---------|
| 1 | **過渡動畫時長** | 互動元素一律 `transition: all 200ms ease-out`，嚴禁超過 300ms |
| 2 | **動作偏好無障礙** | 每份 `<style>` 結尾必須附加 `@media (prefers-reduced-motion: reduce)` 區塊，停用所有 transition 與 animation |
| 3 | **鍵盤焦點樣式** | 互動元素強制 `:focus-visible { outline: 2px solid currentColor; outline-offset: 3px; }`，嚴禁 `outline: none` |
| 4 | **觸控目標尺寸** | `<a>` 與 `<button>` 相關 class 設定 `min-height: 44px`，符合 WCAG 2.5.5 / 人機工學標準 |
| 5 | **段落行高** | `<p>` 相關 class 加 `line-height: 1.65`；標題加 `line-height: 1.3` |
| 6 | **字型尺寸層次** | `a11y-heading-*` 確保 h3 ≥ 1.35rem → h4 ≥ 1.15rem → h5 ≥ 1rem 的清晰遞減層次 |
| 7 | **動畫效能屬性** | 視覺效果只允許使用 `transform` 與 `opacity`，禁止動畫 `top`/`left`/`width`/`height`（避免觸發 Reflow） |
| 8 | **色彩不單靠顏色** | 警告/錯誤相關 class 必須搭配 `font-weight: 700` 或 `text-decoration: underline`，不可只靠顏色傳遞資訊（符合 WCAG 1.4.1） |
| 9 | **圖片響應式** | 圖片相關 class 強制 `max-width: 100%; height: auto; display: block` |