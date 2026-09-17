export interface Accountant {
  id: number
  name: string
  email: string
  avatar: string
  title: string
  status: string
}

export interface SubModule {
  id: string
  name: string
  assignedAccountantId: number | null
}

export interface Subsystem {
  id: string
  name: string
  description: string
  icon: string // Lucide icon component name
  color: string // Tailwind color class prefix (e.g. "blue", "green")
  modules: SubModule[]
}
