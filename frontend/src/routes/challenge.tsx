import { createFileRoute } from '@tanstack/react-router'
import { AccompagnementPage } from './accompagnement'

export const Route = createFileRoute('/challenge')({
  component: AccompagnementPage,
})
