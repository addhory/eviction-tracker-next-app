"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Upload,
  File as FileIcon,
  CheckCircle,
  AlertCircle,
  Download,
  X,
} from "lucide-react";
import { DocumentType } from "@/types";
import { useUploadDocument, useJobDocuments } from "@/hooks/queries";
import { toast } from "sonner";

const documentTypes: {
  value: DocumentType;
  label: string;
  description: string;
}[] = [
  {
    value: "eviction_notice",
    label: "Eviction Notice",
    description: "The completed eviction notice document",
  },
  {
    value: "photo_of_posted_notice",
    label: "Photo of Posted Notice",
    description: "Photo showing the notice posted on the property",
  },
  {
    value: "receipt",
    label: "Receipt",
    description: "Mailing receipt from the post office",
  },
  {
    value: "certificate_of_mailing",
    label: "Certificate of Mailing",
    description: "Official certificate of mailing from USPS",
  },
];

const documentUploadSchema = z.object({
  document_type: z.enum(
    [
      "eviction_notice",
      "photo_of_posted_notice",
      "receipt",
      "certificate_of_mailing",
    ],
    {
      message: "Please select a document type",
    }
  ),
  file: z
    .instanceof(File)
    .refine(
      (file: any) => file.size <= 10 * 1024 * 1024,
      "File size must be less than 10MB"
    )
    .refine(
      (file: any) =>
        ["application/pdf", "image/jpeg", "image/png", "image/jpg"].includes(
          file.type
        ),
      "Only PDF, JPEG, and PNG files are allowed"
    ),
  notes: z.string().optional(),
});

type DocumentUploadFormData = z.infer<typeof documentUploadSchema>;

interface DocumentUploadFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  caseId: string;
  contractorId: string;
  onSuccess?: () => void;
}

export function DocumentUploadForm({
  open,
  onOpenChange,
  caseId,
  contractorId,
  onSuccess,
}: DocumentUploadFormProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const uploadMutation = useUploadDocument();
  const { data: documentsData, refetch: refetchDocuments } =
    useJobDocuments(caseId);

  const existingDocuments = documentsData || [];

  const form = useForm<DocumentUploadFormData>({
    resolver: zodResolver(documentUploadSchema),
    defaultValues: {
      notes: "",
    },
  });

  const selectedDocumentType = form.watch("document_type");

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      form.setValue("file", file);
      form.clearErrors("file");
    }
  };

  const onSubmit = async (data: DocumentUploadFormData) => {
    try {
      const result = await uploadMutation.mutateAsync({
        caseId,
        documentType: data.document_type,
        file: data.file,
      });

      if (result) {
        toast.success("Document uploaded successfully!");
        form.reset();
        setSelectedFile(null);
        refetchDocuments();
        onOpenChange(false);
        onSuccess?.();
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to upload document"
      );
    }
  };

  const isDocumentUploaded = (docType: DocumentType) => {
    return existingDocuments.some((doc) => doc.document_type === docType);
  };

  const getDocumentInfo = (docType: DocumentType) => {
    return documentTypes.find((dt) => dt.value === docType);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Upload Required Documents</DialogTitle>
          <DialogDescription>
            Please upload all four required documents to complete this job. All
            fields are mandatory.
          </DialogDescription>
        </DialogHeader>

        {/* Document Requirements Overview */}
        <div className="space-y-3 mb-6">
          <h4 className="font-medium text-sm">Required Documents Status:</h4>
          <div className="grid grid-cols-1 gap-2">
            {documentTypes.map((docType) => {
              const isUploaded = isDocumentUploaded(docType.value);
              return (
                <div
                  key={docType.value}
                  className={`flex items-center justify-between p-3 rounded-lg border ${
                    isUploaded
                      ? "bg-green-50 border-green-200"
                      : "bg-gray-50 border-gray-200"
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    {isUploaded ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-amber-500" />
                    )}
                    <div>
                      <div className="font-medium text-sm">{docType.label}</div>
                      <div className="text-xs text-gray-500">
                        {docType.description}
                      </div>
                    </div>
                  </div>
                  <Badge variant={isUploaded ? "default" : "secondary"}>
                    {isUploaded ? "Uploaded" : "Required"}
                  </Badge>
                </div>
              );
            })}
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Document Type Selection */}
            <FormField
              control={form.control}
              name="document_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Document Type</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select document type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {documentTypes.map((docType) => (
                        <SelectItem
                          key={docType.value}
                          value={docType.value}
                          disabled={isDocumentUploaded(docType.value)}
                        >
                          <div className="flex items-center justify-between w-full">
                            <span>{docType.label}</span>
                            {isDocumentUploaded(docType.value) && (
                              <Badge variant="secondary" className="ml-2">
                                Already uploaded
                              </Badge>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* File Upload */}
            <FormField
              control={form.control}
              name="file"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>File Upload</FormLabel>
                  <FormControl>
                    <div className="space-y-4">
                      {selectedDocumentType && (
                        <Alert>
                          <FileIcon className="h-4 w-4" />
                          <AlertDescription>
                            {getDocumentInfo(selectedDocumentType)?.description}
                            <br />
                            <strong>Accepted formats:</strong> PDF, JPEG, PNG
                            (max 10MB)
                          </AlertDescription>
                        </Alert>
                      )}

                      <div className="flex items-center justify-center w-full">
                        <label
                          htmlFor="file-upload"
                          className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100"
                        >
                          <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            <Upload className="w-8 h-8 mb-3 text-gray-400" />
                            <p className="mb-2 text-sm text-gray-500">
                              <span className="font-semibold">
                                Click to upload
                              </span>{" "}
                              or drag and drop
                            </p>
                            <p className="text-xs text-gray-500">
                              PDF, PNG, JPG (MAX. 10MB)
                            </p>
                          </div>
                          <input
                            id="file-upload"
                            type="file"
                            className="hidden"
                            accept=".pdf,.png,.jpg,.jpeg"
                            onChange={handleFileChange}
                          />
                        </label>
                      </div>

                      {selectedFile && (
                        <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg">
                          <div className="flex items-center space-x-3">
                            <FileIcon className="h-5 w-5 text-blue-600" />
                            <div>
                              <div className="font-medium text-sm text-blue-900">
                                {selectedFile.name}
                              </div>
                              <div className="text-xs text-blue-700">
                                {(selectedFile.size / 1024 / 1024).toFixed(2)}{" "}
                                MB
                              </div>
                            </div>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedFile(null);
                              form.setValue("file", undefined as any);
                            }}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Notes */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Add any additional notes about this document..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={uploadMutation.isPending || !selectedFile}
              >
                {uploadMutation.isPending ? "Uploading..." : "Upload Document"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

interface DocumentListProps {
  caseId: string;
  contractorId: string;
}

export function DocumentList({ caseId, contractorId }: DocumentListProps) {
  const { data: documentsData, isLoading } = useJobDocuments(caseId);

  const documents = documentsData || [];

  if (isLoading) {
    return <div>Loading documents...</div>;
  }

  if (documents.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <FileIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            No documents uploaded
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            Upload the required documents to complete this job.
          </p>
        </CardContent>
      </Card>
    );
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatFileSize = (bytes: number) => {
    return (bytes / 1024 / 1024).toFixed(2) + " MB";
  };

  const getDocumentLabel = (docType: DocumentType) => {
    return documentTypes.find((dt) => dt.value === docType)?.label || docType;
  };

  return (
    <div className="space-y-4">
      {documents.map((doc) => (
        <Card key={doc.id}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <FileIcon className="h-8 w-8 text-blue-600" />
                <div>
                  <div className="font-medium">
                    {getDocumentLabel(doc.document_type)}
                  </div>
                  <div className="text-sm text-gray-500">
                    {doc.file_name} •{" "}
                    {doc.file_size && formatFileSize(doc.file_size)}
                  </div>
                  <div className="text-xs text-gray-400">
                    Uploaded: {formatDate(doc.uploaded_at)}
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Badge variant="secondary">Uploaded</Badge>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(doc.file_url, "_blank")}
                >
                  <Download className="h-4 w-4 mr-2" />
                  View
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
