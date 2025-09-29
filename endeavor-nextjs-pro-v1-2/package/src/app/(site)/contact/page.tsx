import ContactForm from "@/components/Contact/Form";
import ContactInfo from "@/components/Contact/ContactInfo";
import Location from "@/components/Contact/OfficeLocation";
import Volunteer from "@/components/SharedComponent/Volunteer";
import React from "react";
import HeroSub from "@/components/SharedComponent/HeroSub";
import { Metadata } from "next";
export const metadata: Metadata = {
  title: "Contact | Endeavor",
};

const page = () => {
  return (
    <>
      <HeroSub
        title="Contact Us"
      />
      <ContactInfo />
      <ContactForm />
      <Location />
      <Volunteer />
    </>
  );
};

export default page;
