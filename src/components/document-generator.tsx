"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  FileText,
  Download,
  FileCheck,
  Receipt,
  Loader2,
  CheckCircle,
} from "lucide-react";
import { LegalCase, Property, Tenant, Profile } from "@/types";
import { DocumentService } from "@/services/document-service";

interface DocumentGeneratorProps {
  legalCase: LegalCase;
  property: Property;
  tenant: Tenant;
  landlord: Profile;
}

interface DocumentType {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  available: boolean;
  requiresStatus?: string[];
}

export function DocumentGenerator({
  legalCase,
  property,
  tenant,
  landlord,
}: DocumentGeneratorProps) {
  const [generating, setGenerating] = useState<string | null>(null);
  const [generated, setGenerated] = useState<Set<string>>(new Set());

  const documentTypes: DocumentType[] = [
    {
      id: "thirty-day-notice",
      title: "30-Day Notice to Quit",
      description:
        "Official notice for non-payment of rent (Maryland compliant)",
      icon: FileText,
      available: true,
      requiresStatus: ["NOTICE_DRAFT", "SUBMITTED"],
    },
    {
      id: "case-summary",
      title: "Case Summary Report",
      description: "Comprehensive overview of the legal case details",
      icon: FileCheck,
      available: true,
    },
    {
      id: "payment-receipt",
      title: "Payment Receipt",
      description: "Receipt for processing fees and payments",
      icon: Receipt,
      available: legalCase.payment_status === "PAID",
    },
  ];

  const handleGenerateDocument = async (documentId: string) => {
    setGenerating(documentId);

    try {
      let doc;
      let filename;

      switch (documentId) {
        case "thirty-day-notice":
          doc = DocumentService.generateThirtyDayNotice(
            legalCase,
            property,
            tenant,
            landlord
          );
          filename = `30-day-notice-${legalCase.id}.pdf`;
          break;

        case "case-summary":
          doc = DocumentService.generateCaseSummary(
            legalCase,
            property,
            tenant,
            landlord
          );
          filename = `case-summary-${legalCase.id}.pdf`;
          break;

        case "payment-receipt":
          // For now, we'll generate a case summary as receipt
          // In a real implementation, this would be a proper receipt
          doc = DocumentService.generateCaseSummary(
            legalCase,
            property,
            tenant,
            landlord
          );
          filename = `payment-receipt-${legalCase.id}.pdf`;
          break;

        default:
          throw new Error("Unknown document type");
      }

      // Download the PDF
      doc.save(filename);

      // Mark as generated
      setGenerated((prev) => new Set([...prev, documentId]));
    } catch (error) {
      console.error("Failed to generate document:", error);
      alert("Failed to generate document. Please try again.");
    } finally {
      setGenerating(null);
    }
  };

  const isDocumentAvailable = (docType: DocumentType): boolean => {
    if (!docType.available) return false;

    if (docType.requiresStatus) {
      return docType.requiresStatus.includes(legalCase.status);
    }

    return true;
  };

  const getAvailabilityReason = (docType: DocumentType): string => {
    if (!docType.available) {
      if (docType.id === "payment-receipt") {
        return "Payment must be completed first";
      }
      return "Not available";
    }

    if (
      docType.requiresStatus &&
      !docType.requiresStatus.includes(legalCase.status)
    ) {
      return `Available when case status is: ${docType.requiresStatus.join(
        " or "
      )}`;
    }

    return "";
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Document Generation
        </CardTitle>
        <CardDescription>
          Generate legal documents and reports for this case
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {documentTypes.map((docType) => {
          const available = isDocumentAvailable(docType);
          const isGenerating = generating === docType.id;
          const isGenerated = generated.has(docType.id);

          return (
            <div
              key={docType.id}
              className={`p-4 border rounded-lg ${
                available ? "border-border" : "border-muted bg-muted/50"
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 flex-1">
                  <div
                    className={`p-2 rounded ${
                      available ? "bg-primary/10" : "bg-muted"
                    }`}
                  >
                    <docType.icon
                      className={`h-4 w-4 ${
                        available ? "text-primary" : "text-muted-foreground"
                      }`}
                    />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4
                        className={`font-medium ${
                          available ? "" : "text-muted-foreground"
                        }`}
                      >
                        {docType.title}
                      </h4>
                      {isGenerated && (
                        <Badge
                          variant="secondary"
                          className="bg-green-100 text-green-800"
                        >
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Generated
                        </Badge>
                      )}
                    </div>
                    <p
                      className={`text-sm ${
                        available
                          ? "text-muted-foreground"
                          : "text-muted-foreground"
                      }`}
                    >
                      {docType.description}
                    </p>
                    {!available && (
                      <p className="text-xs text-amber-600 mt-1">
                        {getAvailabilityReason(docType)}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {available ? (
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={isGenerating}
                        >
                          {isGenerating ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Download className="h-4 w-4" />
                          )}
                          {isGenerating ? "Generating..." : "Generate"}
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle className="flex items-center gap-2">
                            <docType.icon className="h-5 w-5" />
                            Generate {docType.title}
                          </DialogTitle>
                          <DialogDescription>
                            This will generate a PDF document with the current
                            case information.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div className="p-4 border rounded-lg bg-muted/50">
                            <h4 className="font-medium mb-2">
                              Document Preview
                            </h4>
                            <div className="text-sm space-y-1">
                              <p>
                                <span className="font-medium">Case:</span>{" "}
                                {legalCase.case_type} - {legalCase.id}
                              </p>
                              <p>
                                <span className="font-medium">Property:</span>{" "}
                                {property.address}
                              </p>
                              <p>
                                <span className="font-medium">Tenant:</span>{" "}
                                {tenant.tenant_names.join(", ")}
                              </p>
                              <p>
                                <span className="font-medium">Status:</span>{" "}
                                {legalCase.status.replace("_", " ")}
                              </p>
                            </div>
                          </div>

                          <Separator />

                          <div className="flex justify-end gap-2">
                            <DialogTrigger asChild>
                              <Button variant="outline">Cancel</Button>
                            </DialogTrigger>
                            <Button
                              onClick={() => handleGenerateDocument(docType.id)}
                              disabled={isGenerating}
                            >
                              {isGenerating ? (
                                <>
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  Generating...
                                </>
                              ) : (
                                <>
                                  <Download className="mr-2 h-4 w-4" />
                                  Generate & Download
                                </>
                              )}
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  ) : (
                    <Button variant="outline" size="sm" disabled>
                      <Download className="h-4 w-4" />
                      Generate
                    </Button>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <div className="flex items-start gap-2">
            <FileText className="h-4 w-4 text-blue-600 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-blue-900">Maryland Compliance</p>
              <p className="text-blue-700">
                All generated documents are designed to comply with Maryland
                state laws and regulations for eviction proceedings. Please
                review all documents before filing with the court.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
