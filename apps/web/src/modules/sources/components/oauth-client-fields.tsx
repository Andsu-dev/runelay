import { useState } from "react";
import { Button } from "@/components/ui/action/button";
import { Field } from "@/components/ui/form/field";
import { Input } from "@/components/ui/form/input";
import { Textarea } from "@/components/ui/form/textarea";
import { useT } from "@/lib/i18n";
import { OAUTH_CALLBACK_PATH } from "@/modules/sources/constants/source.constants";
import type { SourceDraft } from "@/modules/sources/schemas/source-draft.schema";

interface OAuthClientFieldsProps {
  draft: SourceDraft;
  onChange: (draft: SourceDraft) => void;
}

export function OAuthClientFields({ draft, onChange }: OAuthClientFieldsProps) {
  const t = useT();
  const [open, setOpen] = useState(Boolean(draft.oauthClientId));

  if (!open) {
    return (
      <Button type="button" variant="ghost" size="sm" className="self-start" onClick={() => setOpen(true)}>
        {t("sources.fields.addOAuthClient")}
      </Button>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs text-muted-foreground">
        {t("sources.fields.oauthClientHint")}{" "}
        <code className="break-all font-mono">{`${window.location.origin}${OAUTH_CALLBACK_PATH}`}</code>
      </p>
      <Field label="Client ID">
        <Input
          value={draft.oauthClientId}
          onChange={(event) => onChange({ ...draft, oauthClientId: event.target.value })}
          autoComplete="off"
        />
      </Field>
      <Field label="Client secret" hint={t("sources.fields.oauthClientSecretHint")}>
        <Input
          type="password"
          value={draft.oauthClientSecret}
          onChange={(event) => onChange({ ...draft, oauthClientSecret: event.target.value })}
          autoComplete="off"
        />
      </Field>
      <Field label="Scopes" hint={t("sources.fields.oauthClientScopesHint")}>
        <Textarea
          value={draft.oauthClientScopes}
          onChange={(event) => onChange({ ...draft, oauthClientScopes: event.target.value })}
          placeholder="https://www.googleapis.com/auth/gmail.readonly"
          className="min-h-16 font-mono text-xs"
        />
      </Field>
    </div>
  );
}
