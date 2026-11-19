import type { SourceView } from "@runelay/shared";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { type FormEvent, useState } from "react";
import { Button } from "@/components/ui/action/button";
import { translate, translateError, useT } from "@/lib/i18n";
import { toast } from "@/lib/toast";
import { sourcesQuery, updateSource } from "@/modules/sources/api/sources.api";
import { emptyDraft, oauthClientChange, oauthClientFromFields } from "@/modules/sources/utils/source-draft";
import { OAuthClientFields } from "./oauth-client-fields";

interface GoogleOAuthClientFormProps {
  source: SourceView;
}

export function GoogleOAuthClientForm({ source }: GoogleOAuthClientFormProps) {
  const t = useT();
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState(() => ({
    ...emptyDraft(),
    oauthClientId: source.oauthClientId ?? "",
    oauthClientScopes: source.oauthClientScopes.join("\n"),
  }));
  const change = oauthClientChange(draft, source, oauthClientFromFields(draft));

  const save = useMutation({
    mutationFn: () => updateSource(source.name, { oauthClient: change }),
    onSuccess: (updated) => {
      queryClient.setQueryData(["sources", source.name], updated);
      queryClient.invalidateQueries({ queryKey: sourcesQuery.queryKey });
      setDraft((current) => ({ ...current, oauthClientSecret: "" }));
      toast(translate("sources.google.ownClientSaved"), "info");
    },
    onError: (error) => toast(translateError(error), "error"),
  });

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (change !== undefined) save.mutate();
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-3 rounded-xl bg-card p-4 sm:p-5">
      <p className="text-xs text-muted-foreground">{t("sources.google.ownClient")}</p>
      <OAuthClientFields draft={draft} onChange={setDraft} />
      {draft.oauthClientId || source.oauthClientId ? (
        <div className="flex justify-end">
          <Button
            type="submit"
            disabled={change === undefined}
            loading={save.isPending}
            loadingText={t("sources.google.ownClientSaving")}
          >
            {t("sources.google.ownClientSave")}
          </Button>
        </div>
      ) : null}
    </form>
  );
}
