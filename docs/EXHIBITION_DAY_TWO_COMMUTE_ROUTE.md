# 展覽版第二天：街道＋捷運通勤路線規格

狀態：展覽版 canonical 規格
最後更新：2026-09-27

這份文件定義展覽版第二天 `morning-route` 的四片路線拼圖、完整行程列、逐段移動與捷運日常事件。Unity 移植與 Web 後續修改都應保留這裡的行為契約，不可只照目前 React component 的畫面結構重做。

## 體驗目的

第二天不再讓玩家從街道、捷運與商店中自由選兩格。這一段要讓玩家：

1. 使用既有路線素材完成一條可連通的雙格路線。
2. 拼圖只要求道路寬窄相連，街道與捷運沒有先後限制。
3. 在捷運點體驗一次隨機通勤日常事件。
4. 到街道後接續傳單與青蛙主線。
5. 全程看見完整的 `家 → 捷運 → 街道 → 公司` 行程，而不是每一段各自顯示兩點。

## 路線拼圖

盤面維持兩個可放置格，上方固定公司、下方固定家。玩家看到的拼圖庫只有以下四片，全部沿用 `public/images/route_255/`：

| 拼圖 | 圖檔 | `topEdge` | `bottomEdge` | 用途 |
| --- | --- | --- | --- | --- |
| 街道・寬接寬 | `wide_to_wide_街道.png` | `wide` | `wide` | 正解的街道段 |
| 街道・直路 | `straight_街道.png` | `narrow` | `narrow` | 可用於另一條連通路線 |
| 捷運・窄接寬 | `narrow_to_wide_捷運.png` | `narrow` | `wide` | 干擾片 |
| 捷運・寬接窄 | `wide_to_narrow_捷運.png` | `wide` | `narrow` | 正解的捷運段 |

拼圖庫高度為 `124px`，四片拼圖在區域內垂直置中。不可恢復原本含商店的六片拼圖庫，也不可另做一套展覽版專用路線圖。

### 完成條件

出發前必須同時符合：

- 兩個空格都已放入拼圖。
- 公司、兩片中間路線與家的寬窄接頭全部連通。

不檢查街道與捷運的先後。盤面由上往下排成 `公司 → 街道寬接寬 → 捷運寬接窄 → 家`，或 `公司 → 捷運寬接窄 → 街道直路 → 家` 都可完成。

道路接通就自動收攏並依序亮起，再顯示完成與出發按鈕；不可因地點順序阻擋出發，也不顯示順序要求或順序錯誤提示。雙格關卡約 1.53 秒後顯示出發，詳細狀態與視覺見 [路線接通回饋與甜點店協助](ROUTE_CONNECTION_FEEDBACK_AND_ASSIST.md)。

## 完整行程與逐段移動

底部行程列的資料契約為：

```text
itinerary = [家, 捷運, 街道, 公司]
```

拼圖通關判定與劇情事件順序分開。兩種連通排列都沿用以下劇情行程，避免通勤過場倒走或跳過事件：

```text
家 → 捷運 → 街道 → 公司
```

每一次通勤過場都必須傳入同一份完整 itinerary。過場只改變「目前移動的起點索引與終點索引」，不可把行程列裁成目前兩點。

| 段落 | 角色移動 | 底部仍顯示 | 抵達後行為 |
| --- | --- | --- | --- |
| 第一段 | 家 → 捷運 | 家、捷運、街道、公司 | 播放一個捷運通勤事件 |
| 第二段 | 捷運 → 街道 | 家、捷運、街道、公司 | 進入 `street-flyer` |
| 第三段 | 街道 → 公司 | 家、捷運、街道、公司 | 進入 `street-office-arrival` |

小麥位置圖示只能在目前 leg 的兩個座標之間移動。底部進度亮點則以整份 itinerary 的全程比例計算：第一段結束停在捷運、第二段結束停在街道、第三段才抵達公司。

## 捷運日常事件

抵達捷運後，從下列三個既有漫畫格隨機選一個：

| 事件 ID | 漫畫格 | 結果 |
| --- | --- | --- |
| `backpack-hit` | `日常事件漫畫格/捷運公車_背包晃過來.png` | 疲勞值 `+5` |
| `rush-hour-crowd` | `日常事件漫畫格/捷運_滿員電車.png` | 疲勞值 `+5` |
| `seat-spread` | `日常事件漫畫格/捷運_隔壁開腿.png` | 疲勞值 `+5` |

這裡是無選項的日常事件 modal，沿用 `StreetNoChoiceEventModal` 的結果揭露節奏。事件結束後必須回到同一份 itinerary，播放捷運到街道的第二段移動；不可直接跳到街道、公司或重新開啟路線盤。

## Web 流程契約

```text
morning-route / route-game
→ 家到捷運 leg
→ 隨機捷運通勤事件
→ 捷運到街道 leg
→ street-flyer
→ work-return
→ street-to-company leg
→ street-office-arrival
→ work-clicker
```

主要責任位置：

| 檔案 | 責任 |
| --- | --- |
| `src/components/game/StorySimpleMetroRouteView.tsx` | 四片拼圖、完成條件、itinerary 建立、前兩段移動與捷運事件 |
| `src/components/game/ExhibitionExperienceView.tsx` | 街道事件後的第三段移動與後續 phase |
| `src/components/game/events/DepartureTransitionOverlay.tsx` | 依完整行程計算小麥位置及全程進度 |
| `src/lib/game/exhibitionSceneJump.ts` | `morning-route` 的展覽選單描述 |
| `src/components/game/GameFrame.tsx` | 桌面展覽進度選單描述 |

## Unity 移植資料建議

Unity 不要為三段各建一條獨立路線。建議保留一份行程狀態：

```text
CommuteItineraryState
- points: [Home, Metro, Street, Company]
- currentPointIndex
- destinationPointIndex
- pendingLocationEvent
- completedLocationEvents
```

轉場開始時只指定 `currentPointIndex` 與 `destinationPointIndex`；地圖列永遠讀取完整 `points`。抵達後由目的地類型決定要開捷運日常事件、街道主線或公司進場。

## 驗收清單

- 拼圖庫只顯示指定四片，區域高度 `124px` 且垂直置中。
- 只放街道、只放捷運、未填滿或接頭錯誤都不能出發。
- 兩種街道／捷運排列只要寬窄連通，都能顯示完成並出發，不得阻擋其中一種。
- 通勤劇情仍依家 → 捷運 → 街道 → 公司播放，不以拼圖排列限制通關。
- 家→捷運、捷運→街道、街道→公司三段過場都顯示完整四點。
- 每段小麥只在該段起終點之間移動，進度不會每段重設成全程 0%。
- 捷運事件三張漫畫格都能被抽到，結果皆為疲勞值 `+5`。
- 捷運事件結束後先播捷運→街道，再進 `street-flyer`。
- 街道主線結束後播放街道→公司，最後才進辦公室。
- 繁中、日文、英文的提示、事件文字與圖片替代文字都能正常顯示。
- `git diff --check`、TypeScript 檢查與 production build 通過。
