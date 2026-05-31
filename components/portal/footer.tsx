import { GraduationCap, Mail, MapPin, Phone } from "lucide-react"
import Link from "next/link"

export function PortalFooter() {
  return (
    <footer className="border-t border-glacier bg-white dark:border-lapis dark:bg-abyss">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-8 py-10 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="flex size-9 items-center justify-center rounded-lg bg-gradient-to-br from-abyss to-lapis text-quartz shadow-sm dark:from-quartz dark:to-glacier dark:text-abyss">
                <GraduationCap className="size-4" />
              </div>
              <span className="text-sm font-semibold text-abyss dark:text-quartz">
                ComSite Portal
              </span>
            </div>
            <p className="text-sm leading-relaxed text-slate-blue dark:text-glacier">
              Code Innovation, Connect Education, Conquer Excellence.
            </p>
          </div>

          <div className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-widest text-abyss dark:text-quartz">
              Navigation
            </h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/about"
                  className="text-sm text-slate-blue transition-colors hover:text-abyss dark:text-glacier dark:hover:text-quartz"
                >
                  About Us
                </Link>
              </li>
              <li>
                <Link
                  href="/"
                  className="text-sm text-slate-blue transition-colors hover:text-abyss dark:text-glacier dark:hover:text-quartz"
                >
                  Home
                </Link>
              </li>
            </ul>
          </div>

          <div className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-widest text-abyss dark:text-quartz">
              Contact
            </h3>
            <ul className="space-y-2.5">
              <li className="flex items-start gap-2.5 text-sm text-slate-blue dark:text-glacier">
                <MapPin className="mt-0.5 size-4 shrink-0" />
                <span>
                  ISPSC Computing Studies Unit
                  <br />
                  San Nicolas, Candon City, Ilocos Sur
                </span>
              </li>
              <li className="flex items-center gap-2.5 text-sm text-slate-blue dark:text-glacier">
                <Mail className="size-4 shrink-0" />
                <a
                  href="mailto:computingstudies@ispsc.edu.ph"
                  className="transition-colors hover:text-abyss dark:hover:text-quartz"
                >
                  computingstudies@ispsc.edu.ph
                </a>
              </li>
              <li className="flex items-center gap-2.5 text-sm text-slate-blue dark:text-glacier">
                <Phone className="size-4 shrink-0" />
                <span>(077) 674-1421</span>
              </li>
            </ul>
          </div>

          <div className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-widest text-abyss dark:text-quartz">
              About
            </h3>
            <p className="text-sm leading-relaxed text-slate-blue dark:text-glacier">
              The official student portal of the ISPSC Computing Studies Unit.
              Designed to streamline academic services for students, faculty, and
              administrators.
            </p>
          </div>
        </div>

        <div className="border-t border-glacier py-5 dark:border-lapis">
          <p className="text-center text-xs text-slate-blue dark:text-glacier">
            &copy; {new Date().getFullYear()} ComSite Student Portal. All Rights Reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
