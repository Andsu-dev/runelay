import { type FormEvent, useState } from "react";
import { Button } from "@/components/ui/action/button";
import { Field } from "@/components/ui/form/field";
import { Input } from "@/components/ui/form/input";
import { useT } from "@/lib/i18n";
import { SERVER_NAME_MAX_LENGTH } from "@/modules/settings/constants/settings.constants";
import { useAddServer } from "@/modules/settings/hooks/use-add-server";
import { isAllowedServerUrl } from "@/modules/settings/utils/is-allowed-server-url";
import type { RunelayDesktopBridge } from "@/types/runelay-desktop";

interface AddServerFormProps {
  bridge: RunelayDesktopBridge;
  onDone: () => void;
}

export function AddServerForm({ bridge, onDone }: AddServerFormProps) {
  const t = useT();
  const add = useAddServer(bridge);
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const trimmedUrl = url.trim();
  const validUrl = isAllowedServerUrl(trimmedUrl);
  const urlError = trimmedUrl && !validUrl ? t("settings.server.urlRule") : undefined;

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!validUrl) return;
    const trimmedName = name.trim();
    add.mutate({ url: trimmedUrl, ...(trimmedName && { name: trimmedName }) }, { onSuccess: onDone });
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-3 pt-1">
      <Field label={t("settings.servers.nameOptional")}>
        <Input
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder={t("settings.servers.namePlaceholder")}
          maxLength={SERVER_NAME_MAX_LENGTH}
          autoComplete="off"
        />
      </Field>
      <Field label={t("settings.server.serverAddress")} error={urlError}>
        <Input
          value={url}
          onChange={(event) => setUrl(event.target.value)}
          placeholder={t("settings.server.urlPlaceholder")}
          inputMode="url"
          autoComplete="url"
          spellCheck={false}
          autoFocus
          aria-invalid={Boolean(urlError) || undefined}
        />
      </Field>
      {add.error && <p className="text-[13px] text-destructive">{add.error.message}</p>}
      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" disabled={add.isPending} onClick={onDone}>
          {t("settings.servers.cancel")}
        </Button>
        <Button type="submit" loading={add.isPending} disabled={!validUrl}>
          {t("settings.servers.add")}
        </Button>
      </div>
    </form>
  );
}
