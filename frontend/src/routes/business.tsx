import { createFileRoute } from '@tanstack/react-router'
import { AccompagnementPage } from './accompagnement'

export const Route = createFileRoute('/business')({
  component: AccompagnementPage,
})
