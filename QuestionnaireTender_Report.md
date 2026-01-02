# QuestionnaireTender: Tender Creation Process Analysis

Based on the metadata extracted from the `QuestionnaireTender` module, here is an analysis of how the process for creating and managing new Tenders works within the application.

## 1. Core Architecture
The process revolves around the **`TenderPhaseContent`** entity, which acts as the central hub for a specific tender or tender phase (e.g., RFI, RFP).

### Key Entities:
*   **`TenderPhaseContent`**: Tracks status (`Concept`, etc.), deadlines (`CloseDate`, `CloseDateQuestions`), and overall validity.
*   **`QuestionTenderGroup` & `QuestionTender`**: A hierarchical structure for the questionnaire. Tenders are structured into groups (sections) containing individual questions.
*   **`DocumentTender`**: Manages file attachments that are part of the tender specification.
*   **`OpdrachtOmschrijvingTender`**: Specialized entity for the detailed "Job Description" or "Scope of Work".
*   **`TenderDashboardHelper`**: A non-persistent helper (likely) used to calculate progress metrics (e.g., `CompletedActions`, `TotalMergeFields`) shown on the UI.

---

## 2. The Tender Creation Workflow (Step-by-Step)

### Phase I: Initiation & Setup
The creation is likely triggered from a Project context, as seen in `ACT_ProjectNewEdit_OpenPage`.
1.  **Orchestration**: `ACT_TenderPhaseContent_Create_TEST` appears to be a primary entry point for setting up a new tender.
2.  **Job Description**: The system initializes the `OpdrachtOmschrijvingTender` using `SUB_OpdrachtOmschrijvingTender_Create`.
3.  **Template Injection**: Questions are not always created from scratch. `SUB_TenderQuestionnaire_CopyQuestionnaire` suggests that standard templates from the `Questionnaire` module can be imported into the tender-specific structure.

### Phase II: Content Management (The Concept Stage)
While in the `Concept` status, users interact with the **`TenderPhaseContent_Concept_Dashboard`**.
*   **Structuring Logic**: Users add `QuestionTenderGroup` entries. Within these, they define `QuestionTender` records, including specialized logic like **Conditional Questions** (via `ConditionalQuestionMapping`).
*   **Document Management**: Users upload or select documents (`DocumentTender`). The system distinguishes between manual uploads and those coming from master data (`FromStamData`).
*   **Merge Fields**: `MergeFieldTender` records are configured, likely to personalize tender documents or automate data insertion.

### Phase III: Supplier Selection
Users invite suppliers using the **`TenderPhaseContent_Supplier_Select`** page.
*   The system links `GenericData.Supplier` entities to the tender.
*   `SUB_TenderSupplier_GetCreate` ensures that the relationship between the tender phase and the supplier is established.

### Phase IV: Validation & Progress Tracking
Before a tender can be finalized/published:
*   **Validation**: The system runs `VAL_TenderPhaseContent_Create` and logs issues in the `ValidationIssue` entity. This checks for missing deadlines, unconfigured questions, or empty sections.
*   **Dashboarding**: The `TenderDashboardHelper` calculates "Done vs. Total" counters, providing the user with a visual indication of readiness.

---

## 3. Supplier Interaction & Evaluation
Once live, the module handles incoming data:
*   **Responses**: Suppliers provide answers captured in `AnswerSupplier` and upload files to `DocumentUploadSupplier`.
*   **Internal Q&A**: The entities `QuestionSupplier` and `AnswerInkoop` handle the "Question & Answer" era where suppliers ask for clarifications and the purchasing department (`Inkoop`) responds.
*   **Comparison**: The page `CompareSupplierAnswers_HorizontalListMethod` allows internal users to view supplier answers side-by-side for evaluation.

---

## 4. Key Business Logic Observations
*   **Data Isolation**: The module copies data from master templates (`Questionnaire` module) into "Tender-specific" entities (`QuestionTender`). This ensures that if the master template changes later, it doesn't break the audit trail of a tender already in progress.
*   **StamData Integration**: Extensive use of "Master Data" (`StamData`) for both questions and documents, suggesting a focus on standardization and reusability across ANWB tenders.
*   **Merge Field Logic**: The presence of `MergeFieldTender` and `SectionTender` suggests a sophisticated document generation or dynamic content engine within the tender portal.
