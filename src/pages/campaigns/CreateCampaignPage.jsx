import { useCallback, useMemo, useRef } from "react";
import { useBeforeUnload } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  CAMPAIGN_STEPS,
  nextStep,
  prevStep,
  clearDraft,
  selectDraftCampaign,
  selectFormStep,
} from "../../features/campaigns/campaignsSlice";
import { invalidateDashboardCache } from "../../features/dashboard/dashboardSlice";
import { submitCampaign } from "../../features/campaigns/campaignsThunks";
import BasicInfoStep from "../../components/campaigns/steps/BasicInfoStep";
import FundingStep from "./steps/FundingStep";
import MediaStep from "./steps/MediaStep";
import ReviewStep from "./steps/ReviewStep";

const STEP_META = [
  { id: "details", title: "Campaign Details", Component: BasicInfoStep },
  { id: "funding", title: "Funding Goal", Component: FundingStep },
  { id: "media", title: "Media", Component: MediaStep },
  { id: "review", title: "Review & Submit", Component: ReviewStep },
];

const hasUnsavedData = (draft) =>
  Object.values(draft).some((value) => String(value).trim() !== "");

const CreateCampaignPage = () => {
  const dispatch = useDispatch();
  const formStep = useSelector(selectFormStep);
  const draft = useSelector(selectDraftCampaign);

  const isDirty = useMemo(() => hasUnsavedData(draft), [draft]);

  // Warn the user before leaving/refreshing the tab when there are unsaved changes.
  useBeforeUnload(
    useCallback(
      (event) => {
        if (isDirty) {
          event.preventDefault();
          event.returnValue = "";
        }
      },
      [isDirty],
    ),
  );

  // formStep is 1-indexed: 1 == first step, CAMPAIGN_STEPS.length == last.
  const isFirstStep = formStep === 1;
  const isLastStep = formStep === CAMPAIGN_STEPS.length;
  const { title, Component } = STEP_META[formStep - 1];

  const validationRef = useRef(null);

  const handleNext = async () => {
    // If the step exposes a validator, run it and only advance when valid.
    if (
      validationRef.current &&
      typeof validationRef.current.validate === "function"
    ) {
      const ok = await validationRef.current.validate();
      if (ok) dispatch(nextStep());
    } else {
      dispatch(nextStep());
    }
  };
  const handleBack = () => dispatch(prevStep());

  const handleSubmit = () => {
    // Placeholder submit; integrates with campaign service in a later issue.
    console.log("Submitting campaign draft:", draft);
    // A new campaign appears on the dashboard's "Recent Campaigns" list and
    // is reflected in summary stats, so invalidate those caches so the next
    // dashboard load fetches fresh data.
    dispatch(invalidateDashboardCache("campaigns"));
    dispatch(invalidateDashboardCache("stats"));
    // Submit the draft for review. The slice clears draftCampaign and
    // resets formStep on fulfillment (see submitCampaign.extraReducers).
    dispatch(submitCampaign(draft));
  };

  const handleCancel = () => {
    dispatch(clearDraft());
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-primary">Create Campaign</h1>
        <p className="text-slate-500">Start a new social impact project.</p>
      </div>

      {/* Step progress indicator */}
      <ol className="flex items-center gap-2">
        {STEP_META.map((step, index) => {
          const stepNumber = index + 1;
          const isComplete = stepNumber < formStep;
          const isCurrent = stepNumber === formStep;
          return (
            <li key={step.id} className="flex flex-1 items-center gap-2">
              <span
                className={[
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold",
                  isCurrent
                    ? "bg-accent text-white"
                    : isComplete
                      ? "bg-green-500 text-white"
                      : "bg-slate-200 text-slate-500",
                ].join(" ")}
              >
                {isComplete ? "✓" : stepNumber}
              </span>
              {index < STEP_META.length - 1 && (
                <span
                  className={`hidden h-0.5 flex-1 rounded sm:block ${
                    isComplete ? "bg-green-500" : "bg-slate-200"
                  }`}
                />
              )}
            </li>
          );
        })}
      </ol>

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-primary">
          Step {formStep}: {title}
        </h2>
        <Component validationRef={validationRef} />
      </div>

      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleBack}
            disabled={isFirstStep}
            className="rounded-lg border border-slate-300 px-5 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Back
          </button>
          {isDirty && (
            <button
              type="button"
              onClick={handleCancel}
              className="rounded-lg border border-slate-300 px-5 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100"
            >
              Discard draft
            </button>
          )}
        </div>

        {isLastStep ? (
          <button
            type="button"
            onClick={handleSubmit}
            className="rounded-lg bg-green-600 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-green-700"
          >
            Submit Campaign
          </button>
        ) : (
          <button
            type="button"
            onClick={handleNext}
            className="rounded-lg bg-accent px-5 py-2 text-sm font-medium text-white transition-colors hover:opacity-90"
          >
            Next
          </button>
        )}
      </div>
    </div>
  );
};

export default CreateCampaignPage;
