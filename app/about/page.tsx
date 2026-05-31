import { Calendar, Code2, GraduationCap, Lightbulb, Target, Users } from "lucide-react"

function PlaceholderCard({
  icon: Icon,
  title,
  description,
}: {
  icon: typeof GraduationCap
  title: string
  description: string
}) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-border bg-card p-6 shadow-sm transition-all hover:shadow-md">
      <div className="absolute -right-6 -top-6 size-24 rounded-full bg-gradient-to-br from-abyss/5 to-lapis/5 dark:from-primary/5 dark:to-glacier/5" />
      <div className="relative">
        <div className="flex size-12 items-center justify-center rounded-xl bg-gradient-to-br from-abyss to-lapis text-white shadow-sm dark:from-primary dark:to-glacier dark:text-abyss">
          <Icon className="size-5" />
        </div>
        <h3 className="mt-4 text-lg font-semibold text-foreground">{title}</h3>
        <div className="mt-2 h-px w-12 bg-gradient-to-r from-abyss to-lapis dark:from-primary dark:to-glacier" />
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{description}</p>
      </div>
    </div>
  )
}

const teamMembers = [
  {
    name: "Alyssa Faye S. Quidangen",
    role: "Project Manager",
    initials: "AQ",
  },
  {
    name: "Hezron R. Gagarin",
    role: "Tech Lead",
    initials: "HG",
  },
  {
    name: "Christian Alford M. Galinato",
    role: "Main QA / Tester",
    initials: "CG",
  },
  {
    name: "Kyla G. Cablay",
    role: "Data Analyst",
    initials: "KC",
  },
]

const roleColors = [
  "from-violet-500 to-purple-600",
  "from-blue-500 to-cyan-600",
  "from-emerald-500 to-teal-600",
  "from-amber-500 to-orange-600",
]

export default function AboutPage() {
  return (
    <div className="min-h-[calc(100vh-8rem)] bg-background">
      <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
        {/* Hero */}
        <div className="text-center">
          <div className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-gradient-to-br from-abyss to-lapis text-white shadow-md dark:from-primary dark:to-glacier dark:text-abyss">
            <GraduationCap className="size-8" />
          </div>
          <h1 className="mt-6 text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
            About ComSite
            <span className="block text-abyss dark:text-primary">Student Portal</span>
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg leading-relaxed text-muted-foreground">
            Code Innovation, Connect Education, Conquer Excellence.
          </p>
          <div className="mt-6 flex items-center justify-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span className="size-1.5 rounded-full bg-abyss dark:bg-primary" />
              Innovation
            </span>
            <span className="flex items-center gap-1.5">
              <span className="size-1.5 rounded-full bg-lapis dark:bg-glacier" />
              Connection
            </span>
            <span className="flex items-center gap-1.5">
              <span className="size-1.5 rounded-full bg-slate-blue" />
              Excellence
            </span>
          </div>
        </div>

        {/* Mission / Vision */}
        <div className="mt-16 grid gap-6 md:grid-cols-2">
          <div className="rounded-2xl border border-border bg-card p-8 shadow-sm">
            <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-abyss to-lapis text-white dark:from-primary dark:to-glacier dark:text-abyss">
              <Target className="size-5" />
            </div>
            <h2 className="mt-4 text-xl font-semibold text-foreground">Our Mission</h2>
            <p className="mt-3 leading-relaxed text-muted-foreground">
              To provide a seamless and efficient digital platform that empowers
              students, faculty, and administrators with the tools they need to
              excel in academic and administrative tasks.
            </p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-8 shadow-sm">
            <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-lapis to-slate-blue text-white">
              <Lightbulb className="size-5" />
            </div>
            <h2 className="mt-4 text-xl font-semibold text-foreground">Our Vision</h2>
            <p className="mt-3 leading-relaxed text-muted-foreground">
              To be the cornerstone of academic digital transformation at ISPSC,
              setting the standard for innovation, accessibility, and user-centered
              design in student information systems.
            </p>
          </div>
        </div>

        {/* Team Section */}
        <div className="mt-16">
          <div className="text-center">
            <div className="mx-auto flex size-12 items-center justify-center rounded-xl bg-gradient-to-br from-abyss to-lapis text-white dark:from-primary dark:to-glacier dark:text-abyss">
              <Users className="size-5" />
            </div>
            <h2 className="mt-4 text-2xl font-bold text-foreground">Meet the Team</h2>
            <p className="mt-2 text-muted-foreground">
              The people behind this portal.
            </p>
          </div>

          {/* Team Name Card */}
          <div className="mt-10 rounded-2xl border border-border bg-gradient-to-br from-abyss to-lapis p-8 text-center text-white shadow-md dark:from-primary dark:to-glacier dark:text-abyss">
            <Code2 className="mx-auto size-8 opacity-80" />
            <h3 className="mt-3 text-2xl font-bold tracking-wide">GIT LOST</h3>
            <p className="mt-1 text-sm opacity-80">Development Team</p>
          </div>

          {/* Team Members */}
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {teamMembers.map((member, index) => (
              <div
                key={member.name}
                className="group relative overflow-hidden rounded-2xl border border-border bg-card p-6 text-center shadow-sm transition-all hover:-translate-y-1 hover:shadow-md"
              >
                <div className={`mx-auto flex size-16 items-center justify-center rounded-full bg-gradient-to-br ${roleColors[index]} text-lg font-bold text-white shadow-sm`}>
                  {member.initials}
                </div>
                <h3 className="mt-4 text-sm font-semibold text-foreground">{member.name}</h3>
                <p className="mt-1 text-xs text-muted-foreground">{member.role}</p>
              </div>
            ))}
          </div>

          {/* Additional Info */}
          <div className="mt-10 grid gap-6 sm:grid-cols-2">
            <PlaceholderCard
              icon={Calendar}
              title="Date Developed"
              description="May 2026"
            />
            <PlaceholderCard
              icon={GraduationCap}
              title="Institution"
              description="ISPSC — Computing Studies Unit"
            />
          </div>
        </div>
      </div>
    </div>
  )
}
