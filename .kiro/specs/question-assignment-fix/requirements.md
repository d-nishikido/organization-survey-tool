# Requirements Document

## はじめに
質問割り当て画面（SurveyQuestionAssignment）における2つの不具合を修正します。1つ目はUI表示の改善として、割り当て済み質問のカウント表示を削除します。2つ目は機能的な問題として、質問の順序変更時に発生するエラーを修正し、ドラッグ&ドロップによる順序変更が正常に動作するようにします。これにより、HR担当者が調査の質問を円滑に管理できるようになります。

## Requirements

### Requirement 1: 割り当て済み質問カウント表示の削除
**Objective:** HR担当者として、割り当て済み質問セクションの見出しから質問数のカウント表示を削除したい。これにより、シンプルで見やすいUIを提供する。

#### Acceptance Criteria
1. WHEN 質問割り当て画面が表示される THEN 割り当て済み質問セクション SHALL 「割り当て済み質問」というテキストのみを表示する
2. WHEN 質問割り当て画面が表示される THEN 割り当て済み質問セクション SHALL 「(2)」のような質問数カウントを表示しない
3. WHERE 割り当て済み質問セクションの見出し（h2要素） THE 質問割り当て画面 SHALL カウント情報なしのテキストのみをレンダリングする

### Requirement 2: 質問順序変更機能の修正
**Objective:** HR担当者として、割り当て済み質問の順序をドラッグ&ドロップで変更したい。現在発生している「質問の割り当てに失敗しました」エラーを解消し、順序変更を正常に完了できるようにする。

#### Acceptance Criteria
1. WHEN HR担当者が割り当て済み質問をドラッグして別の位置にドロップする THEN 質問割り当て画面 SHALL 新しい順序で質問リストを更新する
2. WHEN 質問順序変更が実行される THEN 質問割り当て画面 SHALL 「質問の割り当てに失敗しました」エラーを表示しない
3. WHEN 質問順序変更が成功する THEN 質問割り当て画面 SHALL 各質問のorder_numを新しい順序に基づいて更新する
4. IF 質問順序変更中にバックエンドAPIエラーが発生する THEN 質問割り当て画面 SHALL 適切なエラーメッセージを表示し、元の順序を維持する
5. WHEN 質問順序変更が完了する THEN 質問割り当て画面 SHALL バックエンドに更新された質問順序を保存する

### Requirement 3: エラーハンドリングの改善
**Objective:** システムとして、質問割り当て処理のエラーハンドリングを改善したい。これにより、ユーザーに適切なフィードバックを提供し、データ整合性を保つ。

#### Acceptance Criteria
1. WHEN handleDropToAssigned関数でエラーが発生する THEN 質問割り当て画面 SHALL エラーの種類に応じた具体的なエラーメッセージを表示する
2. IF ネットワークエラーが発生する THEN 質問割り当て画面 SHALL 「ネットワークエラーが発生しました。再度お試しください。」を表示する
3. IF バリデーションエラーが発生する THEN 質問割り当て画面 SHALL エラーの詳細を含むメッセージを表示する
4. WHEN エラーが発生する THEN 質問割り当て画面 SHALL UIの状態（assignedQuestions、availableQuestions）をエラー発生前の状態に戻す

### Requirement 4: ドラッグ&ドロップ機能の整合性確保
**Objective:** システムとして、新規質問の割り当てと既存質問の順序変更の両方が同じhandleDropToAssigned関数で処理される際の整合性を確保したい。

#### Acceptance Criteria
1. WHEN 利用可能な質問から割り当てリストへドロップされる THEN 質問割り当て画面 SHALL 質問をavailableQuestionsから削除し、assignedQuestionsに追加する
2. WHEN 割り当て済み質問の順序を変更する THEN 質問割り当て画面 SHALL assignedQuestions内で質問の位置のみを変更し、availableQuestionsは変更しない
3. WHEN 質問がドロップされる THEN 質問割り当て画面 SHALL ドラッグ元が利用可能リストか割り当て済みリストかを正しく判別する
4. WHEN バックエンドAPIが呼び出される THEN 質問割り当て画面 SHALL 更新されたassignedQuestionsの質問IDリストを送信する
