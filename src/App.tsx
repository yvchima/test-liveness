import { useState } from "react";
import YouverifyLiveness from "youverify-liveness-web";
import YouverifyPassiveLiveness from "youverify-passive-liveness-web";
import {
  generateDeviceCorrelationId,
  generateSessionId,
  generateSessionToken,
  PUBLIC_MERCHANT_ID,
} from "@/lib/liveness-session";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Provider = "active" | "passive";
type ActiveTaskId = "complete-the-circle" | "yes-or-no" | "motions" | "blink";
type Status = "idle" | "generating" | "running" | "success" | "failure";

const ACTIVE_TASKS: { value: ActiveTaskId; label: string }[] = [
  { value: "complete-the-circle", label: "Complete The Circle" },
  { value: "yes-or-no", label: "Yes Or No" },
  { value: "motions", label: "Motions" },
  { value: "blink", label: "Blink" },
];

function App() {
  const [provider, setProvider] = useState<Provider>("active");
  const [task, setTask] = useState<ActiveTaskId>("complete-the-circle");
  const [presentation, setPresentation] = useState<"modal" | "page">("modal");
  const [firstName, setFirstName] = useState("");

  const [status, setStatus] = useState<Status>("idle");
  const [result, setResult] = useState<unknown>(null);
  const [error, setError] = useState<string | null>(null);

  const handleStart = async () => {
    setStatus("generating");
    setResult(null);
    setError(null);

    let sessionId: string;
    let sessionToken: string;
    try {
      sessionId = await generateSessionId();
      sessionToken = await generateSessionToken(generateDeviceCorrelationId());
    } catch (err) {
      setStatus("idle");
      setError(err instanceof Error ? err.message : "Failed to generate session");
      return;
    }

    setStatus("running");

    const commonOptions = {
      presentation,
      sessionId,
      sessionToken,
      publicKey: PUBLIC_MERCHANT_ID,
      sandboxEnvironment: true,
      forceDevUrl: true,
      user: firstName ? { firstName } : undefined,
          branding: {
            name: "Youverify",
            color: "#46B2C8",
            logo: "./yv_logo.svg",
            logoAlt: "Youverify Logo",
            hideLogoOnMobile: false,
            showPoweredBy: true,
            poweredByText: "Powered by",
            poweredByLogo: "./yv_logo.svg",
          },
      onClose: () => {
        setStatus((prev) => (prev === "running" ? "idle" : prev));
      },
      onSuccess: (data: unknown) => {
        setStatus("success");
        setResult(data);
      },
      onFailure: (data: unknown) => {
        setStatus("failure");
        setResult(data);
      },
    };

    if (provider === "active") {
      const sdk = new YouverifyLiveness(commonOptions);
      sdk.start([{ id: task }]);
    } else {
      const sdk = new YouverifyPassiveLiveness(commonOptions);
      sdk.start([{ id: "passive" }]);
    }
  };

  return (
    <div className="min-h-svh bg-muted/30 flex items-center justify-center p-6">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle>Youverify Liveness Demo</CardTitle>
          <CardDescription>
            Choose a liveness SDK and start the check.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-5">
          <Tabs value={provider} onValueChange={(v) => setProvider(v as Provider)}>
            <TabsList className="w-full">
              <TabsTrigger value="active" className="flex-1">
                Active Liveness
              </TabsTrigger>
              <TabsTrigger value="passive" className="flex-1">
                Passive Liveness
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {provider === "active" && (
            <div className="flex flex-col gap-2">
              <Label htmlFor="task">Task</Label>
              <Select value={task} onValueChange={(v) => setTask(v as ActiveTaskId)}>
                <SelectTrigger id="task" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ACTIVE_TASKS.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <Separator />

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Optional"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="presentation">Presentation</Label>
              <Select value={presentation} onValueChange={(v) => setPresentation(v as "modal" | "page")}>
                <SelectTrigger id="presentation" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="modal">Modal</SelectItem>
                  <SelectItem value="page">Page</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button
            onClick={handleStart}
            disabled={status === "generating" || status === "running"}
          >
            {status === "generating"
              ? "Generating session…"
              : status === "running"
                ? "Running…"
                : "Start Liveness Check"}
          </Button>

          {error && <p className="text-sm text-destructive">{error}</p>}

          {status !== "idle" && status !== "generating" && (
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Status:</span>
                <Badge
                  variant={
                    status === "success" ? "default" : status === "failure" ? "destructive" : "secondary"
                  }
                >
                  {status}
                </Badge>
              </div>
              {result !== null && (
                <pre className="max-h-48 overflow-auto rounded-md bg-muted p-3 text-xs">
                  {JSON.stringify(result, null, 2)}
                </pre>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default App;
