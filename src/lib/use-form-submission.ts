"use client";

import * as React from "react";
import { createClient } from "@/lib/supabase/client";
import type { FormId } from "@/lib/forms-config";

// A form submission row in the `form_submissions` table.
export interface FormSubmission {
  id: string;
  form_id: string;
  data: Record<string, unknown>;
  status: string;
  progress: number;
  created_by: string | null;
  updated_at: string;
}

interface UseFormSubmissionOptions {
  formId: FormId;
  // Function that computes a 0–100 progress value from the current data.
  computeProgress?: (data: Record<string, unknown>) => number;
  // Whether to autosave on data change (default: true, debounced 1.2s).
  autosave?: boolean;
}

export type SaveState = "idle" | "saving" | "saved" | "error";

/**
 * Loads a single form_submissions row for the given form_id (or creates one
 * on first edit) and exposes simple data + save primitives.
 *
 * All forms in EUMIND store their structured content in the JSONB `data`
 * column. This hook abstracts that pattern.
 */
export function useFormSubmission({
  formId,
  computeProgress,
  autosave = true,
}: UseFormSubmissionOptions) {
  const supabase = createClient();
  const [submission, setSubmission] = React.useState<FormSubmission | null>(null);
  const [data, setData] = React.useState<Record<string, unknown>>({});
  const [loading, setLoading] = React.useState(true);
  const [saveState, setSaveState] = React.useState<SaveState>("idle");
  const [submissionId, setSubmissionId] = React.useState<string | null>(null);

  // Keep a ref to the latest data so the autosave timer always has the freshest copy.
  const dataRef = React.useRef(data);
  React.useEffect(() => {
    dataRef.current = data;
  }, [data]);

  // Initial load
  React.useEffect(() => {
    let active = true;
    (async () => {
      try {
        const { data: rows } = await supabase
          .from("form_submissions")
          .select("*")
          .eq("form_id", formId)
          .order("updated_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (!active) return;

        if (rows) {
          setSubmission(rows as FormSubmission);
          setSubmissionId((rows as FormSubmission).id);
          setData((rows as FormSubmission).data ?? {});
        }
      } catch {
        // Ignore — we'll just start with empty data.
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formId]);

  // Public update function — also triggers the autosave timer.
  const update = React.useCallback(
    (patch: Record<string, unknown>) => {
      setData((current) => ({ ...current, ...patch }));
    },
    [],
  );

  // Manual save (used by the explicit "Save" buttons)
  const save = React.useCallback(async () => {
    setSaveState("saving");
    const progress = computeProgress ? computeProgress(dataRef.current) : 0;
    try {
      if (submissionId) {
        const { data: updated, error } = await supabase
          .from("form_submissions")
          .update({
            data: dataRef.current,
            progress,
            updated_at: new Date().toISOString(),
          })
          .eq("id", submissionId)
          .select()
          .single();
        if (error) throw error;
        if (updated) setSubmission(updated as FormSubmission);
      } else {
        const { data: created, error } = await supabase
          .from("form_submissions")
          .insert({
            form_id: formId,
            data: dataRef.current,
            progress,
            status: "Not started",
          })
          .select()
          .single();
        if (error) throw error;
        if (created) {
          setSubmission(created as FormSubmission);
          setSubmissionId((created as FormSubmission).id);
        }
      }
      setSaveState("saved");
      window.setTimeout(() => setSaveState("idle"), 2000);
    } catch (err) {
      console.error("Failed to save form", err);
      setSaveState("error");
      window.setTimeout(() => setSaveState("idle"), 2500);
    }
  }, [computeProgress, formId, submissionId, supabase]);

  // Debounced autosave
  React.useEffect(() => {
    if (!autosave || loading) return;
    const timer = window.setTimeout(() => {
      // Only autosave if there's something to save and we have an existing row OR data to insert.
      if (Object.keys(data).length === 0) return;
      void save();
    }, 1200);
    return () => window.clearTimeout(timer);
  }, [data, autosave, loading, save]);

  // Submit for review — sets status to 'Pending approval'
  const submitForReview = React.useCallback(async () => {
    setSaveState("saving");
    const progress = computeProgress ? computeProgress(dataRef.current) : 100;
    try {
      if (submissionId) {
        const { data: updated, error } = await supabase
          .from("form_submissions")
          .update({
            data: dataRef.current,
            progress: Math.max(progress, 100),
            status: "Pending approval",
            updated_at: new Date().toISOString(),
          })
          .eq("id", submissionId)
          .select()
          .single();
        if (error) throw error;
        if (updated) setSubmission(updated as FormSubmission);
      } else {
        const { data: created, error } = await supabase
          .from("form_submissions")
          .insert({
            form_id: formId,
            data: dataRef.current,
            progress: 100,
            status: "Pending approval",
          })
          .select()
          .single();
        if (error) throw error;
        if (created) {
          setSubmission(created as FormSubmission);
          setSubmissionId((created as FormSubmission).id);
        }
      }
      setSaveState("saved");
      return true;
    } catch (err) {
      console.error("Failed to submit form", err);
      setSaveState("error");
      window.setTimeout(() => setSaveState("idle"), 2500);
      return false;
    }
  }, [computeProgress, formId, submissionId, supabase]);

  return {
    data,
    update,
    save,
    submitForReview,
    loading,
    saveState,
    submission,
    progress: submission?.progress ?? 0,
    status: submission?.status ?? "Not started",
  };
}
