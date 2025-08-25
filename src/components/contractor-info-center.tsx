"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Info,
  Download,
  Clock,
  MapPin,
  AlertTriangle,
  CheckCircle,
  FileText,
  Camera,
  Mail,
} from "lucide-react";

interface CountyInstruction {
  county: string;
  mailingRequirement: string;
  postingRequirement: string;
  timeRequirement: string;
  photoRequirement: string;
  specialInstructions?: string[];
}

const countyInstructions: CountyInstruction[] = [
  {
    county: "Baltimore City",
    mailingRequirement: "AT LEAST 14 days BEFORE the eviction date",
    postingRequirement:
      "AT LEAST 7 days BEFORE the eviction date. You must SIGN AND DATE the form when you post it",
    timeRequirement: "MUST include a Date stamp in the photo",
    photoRequirement:
      "MUST include a Date stamp in the photo. If you don't know how to add one in your native camera app, you can try the TimeStampCameraFree app. But DO NOT include GPS location, JUST time & date",
    specialInstructions: [
      "Beware of dog warnings should be noted",
      "Photo must clearly show the notice is attached to the front door",
      "Make sure to retain your mailing receipt from the post office and a copy of your certificate of mailing/firmbook",
    ],
  },
  {
    county: "Anne Arundel",
    mailingRequirement: "AT LEAST 14 days BEFORE the eviction date",
    postingRequirement:
      "AT LEAST 7 days BEFORE the eviction date. You must SIGN AND DATE the form when you post it",
    timeRequirement: "MUST include a Date stamp in the photo",
    photoRequirement:
      "MUST include a Date stamp in the photo. If you don't know how to add one in your native camera app, you can try the TimeStampCameraFree app. But DO NOT include GPS location, JUST time & date",
    specialInstructions: [
      "The letter must be posted to the front door of the property/unit",
      "Make sure to retain your mailing receipt from the post office and a copy of your certificate of mailing/firmbook",
    ],
  },
  {
    county: "Montgomery",
    mailingRequirement: "AT LEAST 7 days BEFORE the eviction date",
    postingRequirement:
      "AT LEAST 7 days BEFORE the eviction date. You must SIGN AND DATE the form when you post it",
    timeRequirement: "MUST include a Date stamp in the photo",
    photoRequirement:
      "MUST include a Date stamp in the photo. If you don't know how to add one in your native camera app, you can try the TimeStampCameraFree app. But DO NOT include GPS location, JUST time & date",
    specialInstructions: [
      "Montgomery County has specific timing requirements",
      "Make sure to retain your mailing receipt from the post office and a copy of your certificate of mailing/firmbook",
    ],
  },
  {
    county: "Prince George's",
    mailingRequirement: "AT LEAST 7 days BEFORE the eviction date",
    postingRequirement:
      "AT LEAST 7 days BEFORE the eviction date. You must SIGN AND DATE the form when you post it",
    timeRequirement: "MUST include a Date stamp in the photo",
    photoRequirement:
      "MUST include a Date stamp in the photo. If you don't know how to add one in your native camera app, you can try the TimeStampCameraFree app. But DO NOT include GPS location, JUST time & date",
    specialInstructions: [
      "Prince George's County requires strict adherence to timing",
      "Make sure to retain your mailing receipt from the post office and a copy of your certificate of mailing/firmbook",
    ],
  },
];

// Default instructions for all other Maryland counties
const defaultInstructions: CountyInstruction = {
  county: "All Other Maryland Counties",
  mailingRequirement: "AT LEAST 7 days BEFORE the eviction date",
  postingRequirement:
    "AT LEAST 7 days BEFORE the eviction date. You must SIGN AND DATE the form when you post it",
  timeRequirement: "MUST include a Date stamp in the photo",
  photoRequirement:
    "MUST include a Date stamp in the photo. If you don't know how to add one in your native camera app, you can try the TimeStampCameraFree app. But DO NOT include GPS location, JUST time & date",
  specialInstructions: [
    "Make sure to retain your mailing receipt from the post office and a copy of your certificate of mailing/firmbook",
  ],
};

interface ContractorInfoCenterProps {
  children?: React.ReactNode;
}

export function ContractorInfoCenter({ children }: ContractorInfoCenterProps) {
  const [selectedCounty, setSelectedCounty] = useState<string>("");

  const getInstructionsForCounty = (county: string): CountyInstruction => {
    const found = countyInstructions.find(
      (inst) => inst.county.toLowerCase() === county.toLowerCase()
    );
    return found || { ...defaultInstructions, county };
  };

  const currentInstructions = selectedCounty
    ? getInstructionsForCounty(selectedCounty)
    : defaultInstructions;

  // Function to generate blank PDF forms using existing PDF service
  const handleDownloadBlankForm = async (formType: string) => {
    try {
      // Dynamic import to avoid SSR issues
      const {
        generateBlankFinalNoticeOfEvictionDatePDF,
        generateBlankCertificateOfMailingPDF,
        generateBlankFirmbookPDF,
      } = await import("@/services/pdf-service");

      switch (formType) {
        case "eviction_notice":
          generateBlankFinalNoticeOfEvictionDatePDF();
          break;
        case "certificate_3817":
          generateBlankCertificateOfMailingPDF();
          break;
        case "firmbook_3665":
          generateBlankFirmbookPDF();
          break;
        default:
          console.error("Unknown form type:", formType);
      }
    } catch (error) {
      console.error("Error generating PDF:", error);
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        {children || (
          <Button variant="outline">
            <Info className="mr-2 h-4 w-4" />
            Info Center
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Info className="mr-2 h-5 w-5" />
            Contractor Info Center
          </DialogTitle>
          <DialogDescription>
            Instructions, resources, and blank forms for eviction notice posting
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="instructions" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="instructions">Instructions</TabsTrigger>
            <TabsTrigger value="resources">Resources</TabsTrigger>
          </TabsList>

          <TabsContent value="instructions" className="space-y-6">
            {/* County Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  County-Specific Instructions
                </CardTitle>
                <CardDescription>
                  Select a county to view specific posting requirements, or view
                  general instructions below
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {countyInstructions.map((instruction) => (
                    <Button
                      key={instruction.county}
                      variant={
                        selectedCounty === instruction.county
                          ? "default"
                          : "outline"
                      }
                      size="sm"
                      onClick={() => setSelectedCounty(instruction.county)}
                      className="text-xs"
                    >
                      {instruction.county}
                    </Button>
                  ))}
                  <Button
                    variant={selectedCounty === "" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedCounty("")}
                    className="text-xs"
                  >
                    All Others
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Current Instructions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <MapPin className="mr-2 h-5 w-5" />
                  {currentInstructions.county} Instructions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Mailing Requirements */}
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Mail className="h-5 w-5 text-blue-600" />
                    <h4 className="font-semibold text-blue-900">
                      Certificate of Mailing Requirements
                    </h4>
                  </div>
                  <Alert>
                    <Clock className="h-4 w-4" />
                    <AlertDescription>
                      <strong>
                        Certificate of mailing letter needs to be mailed out
                      </strong>{" "}
                      <span className="text-red-600 font-semibold">
                        {currentInstructions.mailingRequirement}
                      </span>
                    </AlertDescription>
                  </Alert>
                </div>

                <Separator />

                {/* Posting Requirements */}
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <FileText className="h-5 w-5 text-green-600" />
                    <h4 className="font-semibold text-green-900">
                      Notice Posting Requirements
                    </h4>
                  </div>
                  <Alert>
                    <CheckCircle className="h-4 w-4" />
                    <AlertDescription>
                      <strong>
                        The letter must be posted to the front door of the
                        property/unit,
                      </strong>{" "}
                      <span className="text-red-600 font-semibold">
                        {currentInstructions.postingRequirement}
                      </span>
                    </AlertDescription>
                  </Alert>
                </div>

                <Separator />

                {/* Photo Requirements */}
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Camera className="h-5 w-5 text-purple-600" />
                    <h4 className="font-semibold text-purple-900">
                      Photo Documentation Requirements
                    </h4>
                  </div>
                  <Alert>
                    <Camera className="h-4 w-4" />
                    <AlertDescription>
                      <strong>The photo of your posting</strong>{" "}
                      <span className="text-red-600 font-semibold">
                        {currentInstructions.photoRequirement}
                      </span>
                    </AlertDescription>
                  </Alert>
                </div>

                {/* Special Instructions */}
                {currentInstructions.specialInstructions && (
                  <>
                    <Separator />
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <AlertTriangle className="h-5 w-5 text-amber-600" />
                        <h4 className="font-semibold text-amber-900">
                          Special Instructions
                        </h4>
                      </div>
                      <div className="space-y-2">
                        {currentInstructions.specialInstructions.map(
                          (instruction, index) => (
                            <div
                              key={index}
                              className="flex items-start space-x-2"
                            >
                              <div className="w-2 h-2 bg-amber-600 rounded-full mt-2 flex-shrink-0" />
                              <p className="text-sm text-gray-700">
                                {instruction}
                              </p>
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* General Process Overview */}
            <Card>
              <CardHeader>
                <CardTitle>Step-by-Step Process</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    {
                      step: 1,
                      title: "Download and Fill Forms",
                      description:
                        "Download blank forms and complete them with case details",
                      icon: <Download className="h-4 w-4" />,
                    },
                    {
                      step: 2,
                      title: "Mail Certificate",
                      description:
                        "Mail the certificate of mailing according to county requirements",
                      icon: <Mail className="h-4 w-4" />,
                    },
                    {
                      step: 3,
                      title: "Post Notice",
                      description:
                        "Post the eviction notice to the front door and sign/date it",
                      icon: <FileText className="h-4 w-4" />,
                    },
                    {
                      step: 4,
                      title: "Document with Photo",
                      description:
                        "Take a timestamped photo of the posted notice",
                      icon: <Camera className="h-4 w-4" />,
                    },
                    {
                      step: 5,
                      title: "Upload Documents",
                      description:
                        "Upload all required documents to complete the job",
                      icon: <CheckCircle className="h-4 w-4" />,
                    },
                  ].map((item) => (
                    <div key={item.step} className="flex items-start space-x-3">
                      <div className="flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex-shrink-0">
                        {item.step}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          {item.icon}
                          <h4 className="font-medium">{item.title}</h4>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">
                          {item.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="resources" className="space-y-6">
            {/* Blank Forms Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Download className="mr-2 h-5 w-5" />
                  Blank Forms Download
                </CardTitle>
                <CardDescription>
                  Download blank forms that you can print and fill out for your
                  jobs
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    {
                      title: "Blank Final Notice of Eviction Date",
                      description: "The main eviction notice form to be posted",
                      onClick: () => handleDownloadBlankForm("eviction_notice"),
                    },
                    {
                      title: "Blank Certificate of Mailing (Form 3817)",
                      description: "USPS certificate of mailing form",
                      onClick: () =>
                        handleDownloadBlankForm("certificate_3817"),
                    },
                    {
                      title: "Blank Firmbook (Form 3665)",
                      description: "USPS firmbook for multiple mailings",
                      onClick: () => handleDownloadBlankForm("firmbook_3665"),
                    },
                  ].map((form, index) => (
                    <Card
                      key={index}
                      className="border-dashed hover:border-solid cursor-pointer transition-all"
                      onClick={form.onClick}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-medium text-sm">
                              {form.title}
                            </h4>
                            <p className="text-xs text-gray-500 mt-1">
                              {form.description}
                            </p>
                          </div>
                          <Download className="h-4 w-4 text-blue-600" />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* FAQ Section */}
            <Card>
              <CardHeader>
                <CardTitle>Frequently Asked Questions</CardTitle>
              </CardHeader>
              <CardContent>
                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value="item-1">
                    <AccordionTrigger>
                      What if the tenant refuses to accept the notice?
                    </AccordionTrigger>
                    <AccordionContent>
                      You are not required to hand the notice directly to the
                      tenant. Simply post it securely to the front door of the
                      property/unit as instructed. Take a clear photo showing
                      the notice is properly attached.
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="item-2">
                    <AccordionTrigger>
                      What if there&apos;s no clear front door or the property
                      has multiple units?
                    </AccordionTrigger>
                    <AccordionContent>
                      Post the notice to the main entrance door of the specific
                      unit. If there&apos;s any ambiguity, contact the landlord
                      for clarification before posting. Include any special
                      circumstances in your job notes.
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="item-3">
                    <AccordionTrigger>
                      Do I need to wait for the tenant to come to the door?
                    </AccordionTrigger>
                    <AccordionContent>
                      No, this is a posting service, not a personal service. You
                      should post the notice securely to the door whether or not
                      anyone is home. Do not attempt to serve it personally
                      unless specifically instructed.
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="item-4">
                    <AccordionTrigger>
                      What if the weather conditions are bad?
                    </AccordionTrigger>
                    <AccordionContent>
                      Try to protect the notice from weather when possible (use
                      a plastic sleeve or bag), but the posting must still be
                      completed on time. Take extra care to ensure the notice
                      remains legible and securely attached.
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="item-5">
                    <AccordionTrigger>
                      How do I add a timestamp to my photos?
                    </AccordionTrigger>
                    <AccordionContent>
                      Most phone cameras have a timestamp feature in settings.
                      If not available, download the
                      &quot;TimeStampCameraFree&quot; app. Make sure to include
                      date and time but DO NOT include GPS location information.
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </CardContent>
            </Card>

            {/* Contact Information */}
            <Card>
              <CardHeader>
                <CardTitle>Need Help?</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <p className="text-sm text-gray-600">
                    If you have questions about a specific job or need
                    clarification on requirements, you can:
                  </p>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-blue-600 rounded-full" />
                      <span className="text-sm">
                        Contact the landlord directly using the information
                        provided in the job details
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-blue-600 rounded-full" />
                      <span className="text-sm">
                        Review county-specific instructions in the Instructions
                        tab
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-blue-600 rounded-full" />
                      <span className="text-sm">
                        Check the FAQ section above for common scenarios
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
