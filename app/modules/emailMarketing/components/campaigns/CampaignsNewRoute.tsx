import { useParams, useSubmit, Form, Link, useActionData } from "@remix-run/react";
import { useState, useEffect, FormEvent } from "react";
import { useTranslation } from "react-i18next";
import ButtonPrimary from "~/components/ui/buttons/ButtonPrimary";
import ButtonSecondary from "~/components/ui/buttons/ButtonSecondary";
import InputGroup from "~/components/ui/forms/InputGroup";
import InputSelector from "~/components/ui/input/InputSelector";
import InputText from "~/components/ui/input/InputText";
import OpenErrorModal from "~/components/ui/modals/OpenErrorModal";
import OpenSuccessModal from "~/components/ui/modals/OpenSuccessModal";
import { EntityViewsApi } from "~/utils/api/EntityViewsApi";
import { useAppOrAdminData } from "~/utils/data/useAppOrAdminData";
import { RowWithDetails } from "~/utils/db/entities/rows.db.server";
import { Campaigns_New } from "../../routes/Campaigns_New";
import EditPageLayout from "~/components/ui/layouts/EditPageLayout";
import WysiwygUtils from "~/utils/shared/WysiwygUtils";
import { useTypedLoaderData } from "remix-typedjson";
const ReactQuill = typeof window === "object" ? require("react-quill") : () => false;
// import ReactQuill from "react-quill";

export default function CampaignsNewRoute() {
  const { t } = useTranslation();
  const appOrAdminData = useAppOrAdminData();
  const data = useTypedLoaderData<Campaigns_New.LoaderData>();
  const actionData = useActionData<Campaigns_New.ActionData>();
  const params = useParams();

  const submit = useSubmit();

  const [name, setName] = useState("");
  const [subject, setSubject] = useState("");
  const [senderId, setSenderId] = useState<string | number | undefined>(data.emailSenders.length > 0 ? data.emailSenders[0].id : "");
  const [htmlBody, setHtmlBody] = useState(defaultHtmlBody);
  // const [track, setTrack] = useState(true);

  const [selectedContactsViewId, setSelectedContactsViewId] = useState<string | number>();
  const [, setSelectedContactsView] = useState<EntityViewsApi.GetEntityViewsWithRows>();

  // const [sender, setSender] = useState<EmailSenderWithoutApiKey>();
  // useEffect(() => {
  //   const sender = data.emailSenders.find((s) => s.fromEmail === senderId);
  //   if (!sender || sender.provider !== "postmark") {
  //     setTrack(false);
  //   }
  //   setSender(sender);
  // }, [data.emailSenders, senderId]);

  const [actionResult, setActionResult] = useState<{ error?: string; success?: string }>();
  useEffect(() => {
    setActionResult(actionData);
  }, [actionData]);

  useEffect(() => {
    setSelectedContactsView(data.contactsViews.find((v) => v.view?.id === selectedContactsViewId));
  }, [data.contactsViews, selectedContactsViewId]);
  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.stopPropagation();
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    submit(formData, {
      method: "post",
    });
  }

  function sendTest(i?: RowWithDetails) {
    const email = window.prompt("Email", appOrAdminData.user?.email);
    if (!email || email.trim() === "") {
      return;
    }
    const form = new FormData();
    form.set("action", i ? "send-contact-preview" : "send-preview");
    form.set("senderId", senderId?.toString() ?? "");
    form.set("contactRowId", i?.id.toString() ?? "");
    form.set("email", email);
    form.set("subject", subject);
    form.set("htmlBody", htmlBody);
    form.set("textBody", "");
    submit(form, {
      method: "post",
    });
  }

  return (
    <EditPageLayout
      title={t("emailMarketing.newCampaign")}
      menu={[
        {
          title: t("emailMarketing.campaigns"),
          routePath: params.tenant ? `/app/${params.tenant}/email-marketing/campaigns` : "/admin/email-marketing/campaigns",
        },
        { title: t("shared.new") },
      ]}
    >
      <Form onSubmit={handleSubmit} className="pb-10">
        <input type="hidden" name="action" value="create" readOnly hidden />

        <div className="relative space-y-4">
          <div className="sticky top-0 left-0 right-0 z-10">
            <div className="rounded-lg border border-dashed border-gray-300 bg-white p-4">
              <div className="space-y-2 lg:flex lg:justify-between lg:space-y-0 lg:space-x-2">
                <div className="flex-grow">
                  <InputText name="name" title={t("shared.name")} value={name} setValue={setName} withLabel={false} placeholder="Broadcast name..." required />
                </div>
                <div className="flex justify-between space-x-2">
                  <ButtonSecondary onClick={() => sendTest()}>{t("emailMarketing.sendPreview")}</ButtonSecondary>
                  <ButtonPrimary type="submit">{t("emailMarketing.saveDraft")}</ButtonPrimary>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col space-y-4">
            <div className="">
              <InputGroup title="Email">
                <div className="grid gap-2 sm:grid-cols-2">
                  <InputSelector
                    name="senderId"
                    title={t("emails.sender")}
                    value={senderId}
                    setValue={setSenderId}
                    withSearch={false}
                    hint={
                      data.emailSenders.length === 0 ? (
                        <>
                          <Link to={params.tenant ? `/app/${params.tenant}/email-marketing/senders` : `/admin/email-marketing/senders`}>
                            <span className="text-xs hover:underline">Manage senders</span>
                          </Link>
                        </>
                      ) : null
                    }
                    options={data.emailSenders.map((s) => {
                      return {
                        name: s.fromEmail,
                        value: s.id,
                      };
                    })}
                    required
                  />
                  <InputSelector
                    required
                    name="contactViewId"
                    title={t("emails.recipientList")}
                    value={selectedContactsViewId}
                    setValue={setSelectedContactsViewId}
                    options={data.contactsViews.map((v) => {
                      return {
                        value: v.view?.id,
                        name: (v.view ? t(v.view.title) : "Default") + " (" + v.rowsCount + ")",
                      };
                    })}
                  />
                  <InputText
                    className="sm:col-span-2"
                    name="subject"
                    title={t("emails.subject")}
                    value={subject}
                    setValue={setSubject}
                    required
                    placeholder="Subject..."
                  />

                  {/* <InputCheckboxWithDescription
                    name="trackOpens"
                    title="Track email"
                    description={
                      <div>
                        Track email delivery, opens and clicks{" "}
                        <span className="text-xs italic text-gray-500">
                          (
                          <a href="https://account.postmarkapp.com/servers" target="_blank" rel="noreferrer" className="underline">
                            you need a postmark webhook on your server message stream
                          </a>
                          )
                        </span>
                        .
                      </div>
                    }
                    value={track}
                    setValue={setTrack}
                    disabled={sender?.provider !== "postmark"}
                  /> */}
                  {/* <div className="space-y-2 truncate">
                    <label className="flex justify-between space-x-2 text-xs font-medium text-gray-600">Contact variables</label>
                    <div className="flex space-x-1 overflow-x-auto rounded-md border border-dashed border-gray-300 bg-gray-50 p-2 text-sm text-gray-500">
                      <div className="select-all">{"{{email}}"}</div>
                      <div>•</div>
                      <div className="select-all">{"{{products}}"}</div>
                    </div>
                  </div> */}

                  <div className="sm:col-span-2">
                    <input type="hidden" name="htmlBody" value={htmlBody} readOnly hidden />
                    <ReactQuill
                      theme="snow"
                      value={htmlBody}
                      onChange={setHtmlBody}
                      modules={{
                        toolbar: WysiwygUtils.toolbarOptions,
                      }}
                    />
                  </div>
                  {/* <InputText
                    name="htmlBody"
                    title="HTML"
                    editor="monaco"
                    editorTheme="light"
                    editorLanguage="html"
                    value={htmlBody}
                    setValue={setHtmlBody}
                    editorSize="lg"
                    required
                  /> */}
                </div>
              </InputGroup>
            </div>
          </div>
        </div>
      </Form>

      <OpenSuccessModal
        title={t("shared.success")}
        description={actionResult?.success?.toString() ?? ""}
        open={!!actionResult?.success}
        onClose={() => setActionResult(undefined)}
      />

      <OpenErrorModal
        title={t("shared.error")}
        description={actionResult?.error?.toString() ?? ""}
        open={!!actionResult?.error}
        onClose={() => setActionResult(undefined)}
      />
    </EditPageLayout>
  );
}

const defaultHtmlBody = `<a style="color:gray" href="{{{ pm:unsubscribe }}}">Unsubscribe from SaasRock Newsletter</a> <br /> <br />

<p style="color:red">This is a test email.</p>

<p>
  <b style="color:blue">Contact variables</b> <br/>
  Email: {{email}} <br/>
  Name: {{name}} <br/>
  Job title: {{job_title}} <br/>
  Company name: {{company_name}} <br/>
</p>

<h1>Title</h1>
<p>Basic text.</p>
<h2>Subtitle</h2>
<ul>
<li>Unordered lists, and:<ol>
<li>One</li>
<li>Two</li>
<li>Three</li>
</ol>
</li>
<li>More</li>
</ul>
<blockquote>
<p>Blockquote</p>
</blockquote>
<p>And <strong>bold</strong>, <em>italics</em>, and even <em>italics and later <strong>bold</strong></em>. Even <del>strikethrough</del>. <a href="https://saasrock.com">A link</a>.</p>
<p>And code highlighting:</p>
<pre><code class="lang-js"><span class="hljs-keyword">var</span> foo = <span class="hljs-string">'bar'</span>;

<span class="hljs-function"><span class="hljs-keyword">function</span> <span class="hljs-title">baz</span><span class="hljs-params">(s)</span> </span>{
   <span class="hljs-keyword">return</span> foo + <span class="hljs-string">':'</span> + s;
}
</code></pre>
<p>Or inline code like <code>var foo = &#39;bar&#39;;</code>.</p>
<p><img src="https://saasrock.com/build/_assets/logo-light-STK7BWWF.png" alt="saasrock" style="height:10px"></p>
<p>The end </p>
`;
