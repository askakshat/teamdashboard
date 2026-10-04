import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Shield, Video, EyeOff } from "lucide-react";

export default function RulesPage() {
  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">
          Project Rules & Compliance Center
        </h2>
        <p className="text-slate-500">
          Guidelines strictly enforced by the international jury.
        </p>
      </div>

      <div className="grid gap-6">
        <Card className="border border-slate-200 bg-white shadow-sm">
          <CardHeader className="pb-2">
            <div className="flex items-center space-x-2">
              <Shield className="h-5 w-5 text-teal-600" />
              <CardTitle className="text-slate-900">
                Student Privacy Shield
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-relaxed text-slate-600">
              Strictly first names only must be used across all public fields
              and forms. Automated validators will warn if surnames, phone
              numbers, home addresses, or personal emails are detected.
            </p>
          </CardContent>
        </Card>

        <Card className="border border-slate-200 bg-white shadow-sm">
          <CardHeader className="pb-2">
            <div className="flex items-center space-x-2">
              <Video className="h-5 w-5 text-rose-600" />
              <CardTitle className="text-slate-900">Media Standards</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-slate-600">
            <ul className="list-disc pl-5 space-y-1">
              <li>
                YouTube videos must be set to{" "}
                <strong>&quot;Unlisted&quot;</strong> (not Public or Private).
              </li>
              <li>
                Video titles must include the word{" "}
                <strong>&quot;Eumind&quot;</strong>.
              </li>
              <li>Expert Interviews max length: 4 minutes.</li>
              <li>Prototype Demos max length: 3 minutes.</li>
              <li>
                Prototype write-up requires at least 6 distinct photos of the
                production process.
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card className="border border-slate-200 bg-white shadow-sm">
          <CardHeader className="pb-2">
            <div className="flex items-center space-x-2">
              <EyeOff className="h-5 w-5 text-slate-500" />
              <CardTitle className="text-slate-900">
                Incognito View Check
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-relaxed text-slate-600">
              Your final portfolio will be viewed by international evaluators
              without EUMIND login access. Ensure that all linked Google Docs,
              Sheets, or external resources have permissions set to &quot;Anyone
              with the link can view&quot;.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
