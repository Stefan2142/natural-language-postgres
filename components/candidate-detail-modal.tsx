import { useState, useEffect } from "react";
import { Result } from "@/lib/types";
import { getCandidateByName } from "@/app/actions";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Loader2, MapPin, Mail, Phone, Calendar, Award, Briefcase, GraduationCap, User, MessageSquare, Bot } from "lucide-react";

interface CandidateDetailModalProps {
  candidate: Result | null;
  onClose: () => void;
}

export const CandidateDetailModal = ({ candidate, onClose }: CandidateDetailModalProps) => {
  const [fullCandidate, setFullCandidate] = useState<Result | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (candidate?.candidate_name) {
      setLoading(true);
      getCandidateByName(String(candidate.candidate_name))
        .then(setFullCandidate)
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [candidate]);

  if (!candidate) return null;

  const parseJSON = (jsonString: any) => {
    if (!jsonString) return null;
    try {
      return typeof jsonString === 'string' ? JSON.parse(jsonString) : jsonString;
    } catch {
      return null;
    }
  };

  const formatLocation = () => {
    const location = parseJSON(fullCandidate?.metadata_location);
    if (!location) return null;
    
    const parts = [];
    if (location.city) parts.push(location.city);
    if (location.country) parts.push(location.country);
    return parts.length > 0 ? parts.join(", ") : null;
  };

  const formatAnswers = () => {
    const answers = parseJSON(fullCandidate?.metadata_answers);
    if (!answers || !Array.isArray(answers)) return [];
    
    return answers.map((item: any, index: number) => ({
      question: item.question?.body || "Question not available",
      answer: item.answer?.body || item.answer?.number || (item.answer?.checked ? "Yes" : "No") || "No answer provided",
      id: index
    }));
  };

  const formatExperience = () => {
    const experience = parseJSON(fullCandidate?.metadata_experience_entries);
    if (!experience || !Array.isArray(experience)) return [];
    
    return experience.map((exp: any) => ({
      title: exp.title || "Position not specified",
      company: exp.company || "Company not specified",
      startDate: exp.start_date,
      endDate: exp.end_date,
      current: exp.current,
      id: exp.id || Math.random()
    }));
  };

  const formatEducation = () => {
    const education = parseJSON(fullCandidate?.metadata_education_entries);
    if (!education || !Array.isArray(education)) return [];
    
    return education.map((edu: any) => ({
      degree: edu.degree || "Degree not specified",
      school: edu.school || "Institution not specified",
      fieldOfStudy: edu.field_of_study,
      startDate: edu.start_date,
      endDate: edu.end_date,
      id: edu.id || Math.random()
    }));
  };

  const getFitScoreColor = (score: number, isNegative = false) => {
    if (isNegative) {
      if (score <= 3) return "bg-green-100 text-green-800";
      if (score <= 6) return "bg-yellow-100 text-yellow-800";
      return "bg-red-100 text-red-800";
    } else {
      if (score >= 8) return "bg-green-100 text-green-800";
      if (score >= 6) return "bg-yellow-100 text-yellow-800";
      return "bg-red-100 text-red-800";
    }
  };

  const data = fullCandidate || candidate;
  const location = formatLocation();
  const answers = formatAnswers();
  const experience = formatExperience();
  const educationEntries = formatEducation();

  return (
    <Dialog open={!!candidate} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Candidate Profile
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="ml-2">Loading candidate details...</span>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Header Section */}
            <Card>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-2xl">{data.candidate_name}</CardTitle>
                    <CardDescription className="text-lg">{data.role_title}</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Badge className={getFitScoreColor(Number(data.fit_score_positive) || 0)}>
                      Fit Score: {data.fit_score_positive}/10
                    </Badge>
                    <Badge className={getFitScoreColor(Number(data.fit_score_negative) || 0, true)}>
                      Red Flags: {data.fit_score_negative}/10
                    </Badge>
                  </div>
                </div>
              </CardHeader>
            </Card>

            {/* Assessment & Rationale */}
            {data.rationale && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bot className="h-4 w-4" />
                    Assessment & Rationale 
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{data.rationale}</p>
                </CardContent>
              </Card>
            )}

            {/* Contact & Location */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  Contact Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {data.metadata_email && (
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span>{data.metadata_email}</span>
                  </div>
                )}
                {data.metadata_phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{data.metadata_phone}</span>
                  </div>
                )}
                {location && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span>{location}</span>
                  </div>
                )}
                {data.metadata_stage && (
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <Badge variant="outline">Stage: {data.metadata_stage}</Badge>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Experience */}
            {experience.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Briefcase className="h-4 w-4" />
                    Professional Experience
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {experience.map((exp) => (
                    <div key={exp.id} className="border-l-2 border-muted pl-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-semibold">{exp.title}</h4>
                          <p className="text-muted-foreground">{exp.company}</p>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {exp.startDate && (
                            <span>{new Date(exp.startDate).getFullYear()}</span>
                          )}
                          {exp.endDate && !exp.current && (
                            <span> - {new Date(exp.endDate).getFullYear()}</span>
                          )}
                          {exp.current && <span> - Present</span>}
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Education */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {data.education && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <GraduationCap className="h-4 w-4" />
                      Education
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm whitespace-pre-wrap">{data.education}</p>
                  </CardContent>
                </Card>
              )}

              {data.achievements_certificates && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Award className="h-4 w-4" />
                      Achievements & Certificates
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm whitespace-pre-wrap">{data.achievements_certificates}</p>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Professional Summary */}
            {data.profile_about && (
              <Card>
                <CardHeader>
                  <CardTitle>Professional Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{data.profile_about}</p>
                </CardContent>
              </Card>
            )}

            {/* Skills */}
            {data.skills && (
              <Card>
                <CardHeader>
                  <CardTitle>Skills</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm whitespace-pre-wrap">{data.skills}</p>
                </CardContent>
              </Card>
            )}

            {/* Q&A Section */}
            {answers.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" />
                    Application Questions & Answers
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {answers.map((qa) => (
                    <div key={qa.id} className="border-l-2 border-blue-200 pl-4">
                      <h4 className="font-medium text-sm mb-1">{qa.question}</h4>
                      <p className="text-sm text-muted-foreground">{qa.answer}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Cover Letter */}
            {data.metadata_cover_letter && (
              <Card>
                <CardHeader>
                  <CardTitle>Cover Letter</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{data.metadata_cover_letter}</p>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};