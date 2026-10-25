import { Phone } from "lucide-react";
import ContactForm from "./ContactForm";
import CopyEmail from "./CopyEmail";
import { GithubIcon, LinkedinIcon } from "./icons";
import { profile } from "@/content/profile";

export default function Contact() {
  return (
    <section id="contact" aria-labelledby="contact-title" className="border-t border-line bg-ground-2">
      <div className="container-x grid grid-cols-1 gap-x-12 gap-y-14 py-24 lg:grid-cols-12 lg:py-32">
        <div className="lg:col-span-5">
          <h2 id="contact-title" className="t-h2 text-ink">
            Get in touch
          </h2>
          <p className="t-lead mt-6 max-w-[34ch] text-ink-2">
            Have a project, a role or a question? Send a message here or write to me directly.
          </p>

          <ul className="mt-10 border-t border-line-2 text-[15.5px]">
            <li className="flex flex-wrap items-center justify-between gap-3 border-b border-line py-4">
              <a href={`mailto:${profile.email}`} className="link font-semibold">
                {profile.email}
              </a>
              <CopyEmail email={profile.email} />
            </li>
            <li className="border-b border-line">
              <a href={profile.linkedin} target="_blank" rel="noreferrer" className="flex items-center gap-3 py-4 text-ink-2 transition-colors hover:text-ink">
                <LinkedinIcon className="h-4 w-4" />
                linkedin.com/in/shaansatsangi
              </a>
            </li>
            <li className="border-b border-line">
              <a href={profile.github} target="_blank" rel="noreferrer" className="flex items-center gap-3 py-4 text-ink-2 transition-colors hover:text-ink">
                <GithubIcon className="h-4 w-4" />
                github.com/Shaan-alpha
              </a>
            </li>
            <li className="border-b border-line">
              <a href={profile.phoneHref} className="flex items-center gap-3 py-4 text-ink-2 transition-colors hover:text-ink">
                <Phone aria-hidden className="h-4 w-4" />
                {profile.phone}
              </a>
            </li>
          </ul>
        </div>

        <div className="lg:col-span-7">
          <ContactForm />
        </div>
      </div>
    </section>
  );
}
