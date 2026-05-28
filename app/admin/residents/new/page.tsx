"use client";
import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { User, Mail, Phone, MapPin, Heart, Pill, AlertCircle, Save } from "lucide-react";
import { TopBar } from "../../../components/layout/TopBar";
import { PageHeader } from "../../../components/ui/PageHeader";
import { FormInput, FormTextarea, FormSelect } from "../../../components/ui/FormInput";
import { Button } from "../../../components/ui/Button";
import Link from "next/link";

export default function AddResidentPage() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo("[data-animate]", { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.5, stagger: 0.07, ease: "power2.out" });
    }, ref);
    return () => ctx.revert();
  }, []);

  return (
    <div ref={ref} className="flex flex-col h-full">
      <TopBar title="Add New Resident" showSearch={false} />
      <div className="px-8 py-6 flex-1">
        <PageHeader title="Add New Resident" subtitle="Complete all required fields to enroll a new community member." />

        <form className="grid grid-cols-3 gap-6" onSubmit={(e) => e.preventDefault()}>
          {/* Personal Info */}
          <div data-animate className="col-span-2 space-y-6">
            <div className="bg-[#1a1d23] rounded-2xl p-6 border border-[#2d333b]">
              <h3 className="text-sm font-bold text-[#8b949e] uppercase tracking-widest mb-5 flex items-center gap-2">
                <User className="w-4 h-4" /> Personal Information
              </h3>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormInput id="add-first-name" label="First Name" placeholder="Maria" />
                  <FormInput id="add-last-name" label="Last Name" placeholder="Santos" />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <FormInput id="add-dob" type="date" label="Date of Birth" />
                  <FormSelect id="add-gender" label="Gender">
                    <option>Female</option><option>Male</option><option>Other</option>
                  </FormSelect>
                  <FormInput id="add-blood" label="Blood Type" placeholder="O+" />
                </div>
                <FormInput id="add-address" label="Home Address" placeholder="123 Rizal St., Tondo, Manila" icon={<MapPin className="w-4 h-4" />} />
                <div className="grid grid-cols-2 gap-4">
                  <FormInput id="add-phone" type="tel" label="Phone Number" placeholder="+63 9XX XXX XXXX" icon={<Phone className="w-4 h-4" />} />
                  <FormInput id="add-email" type="email" label="Email Address" placeholder="maria@example.com" icon={<Mail className="w-4 h-4" />} />
                </div>
                <FormSelect id="add-zone" label="Barangay Zone">
                  <option>Zone 1</option><option>Zone 2</option><option>Zone 3</option>
                  <option>Zone 4</option><option>Zone 5</option>
                </FormSelect>
              </div>
            </div>

            {/* Health Info */}
            <div className="bg-[#1a1d23] rounded-2xl p-6 border border-[#2d333b]">
              <h3 className="text-sm font-bold text-[#8b949e] uppercase tracking-widest mb-5 flex items-center gap-2">
                <Heart className="w-4 h-4 text-[#e53e3e]" /> Health Information (SAMPLE)
              </h3>
              <div className="space-y-4">
                <FormTextarea id="add-conditions" label="Chronic Conditions" placeholder="Type 1 Diabetes, Hypertension..." rows={3} />
                <FormTextarea id="add-allergies" label="Known Allergies" placeholder="Penicillin, Peanuts..." rows={2} />
                <FormTextarea id="add-medications" label="Current Medications" placeholder="Insulin, Lisinopril 10mg..." rows={3} />
                <FormSelect id="add-vulnerability" label="Vulnerability Classification">
                  <option>Low</option><option>Medium</option><option>High</option>
                </FormSelect>
              </div>
            </div>
          </div>

          {/* Side Panel */}
          <div className="space-y-6">
            {/* Emergency Contact */}
            <div data-animate className="bg-[#1a1d23] rounded-2xl p-6 border border-[#2d333b]">
              <h3 className="text-sm font-bold text-[#8b949e] uppercase tracking-widest mb-5 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-[#ed8936]" /> Emergency Contact
              </h3>
              <div className="space-y-4">
                <FormInput id="ec-name" label="Contact Name" placeholder="Juan Santos" />
                <FormInput id="ec-rel" label="Relationship" placeholder="Spouse" />
                <FormInput id="ec-phone" type="tel" label="Phone Number" placeholder="+63 9XX XXX XXXX" />
              </div>
            </div>

            {/* Medications quick add */}
            <div data-animate className="bg-[#1a1d23] rounded-2xl p-6 border border-[#2d333b]">
              <h3 className="text-sm font-bold text-[#8b949e] uppercase tracking-widest mb-5 flex items-center gap-2">
                <Pill className="w-4 h-4 text-[#48bb78]" /> Quick Notes
              </h3>
              <FormTextarea id="quick-notes" label="Additional Notes" placeholder="Any additional notes for responders..." rows={4} />
            </div>

            {/* Actions */}
            <div data-animate className="space-y-3">
              <Button fullWidth size="lg" type="submit">
                <Save className="w-5 h-5" /> Save Resident
              </Button>
              <Link href="/admin/residents" className="block">
                <Button variant="ghost" fullWidth size="md">Cancel</Button>
              </Link>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
