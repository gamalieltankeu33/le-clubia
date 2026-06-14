import { supabase } from './supabase'

export interface MakEtoUCheckoutParams {
  planId: 'semestrial' | 'trimestrial'
  email: string
  firstName?: string
  lastName?: string
  phone?: string
  redirectURL?: string
  meta?: Record<string, any>
}

export interface MakEtoUCheckoutResponse {
  id: string
  url: string
}

export async function createMakEtoUCheckout(params: MakEtoUCheckoutParams): Promise<MakEtoUCheckoutResponse> {
  const { data, error } = await supabase.functions.invoke('maketou-checkout', {
    body: params,
  })

  if (error) {
    console.error('MakEtoU Checkout Error:', error)
    throw new Error(error.message || 'Erreur lors de l\'initialisation du paiement')
  }

  if (data.error) {
    throw new Error(data.error)
  }

  return data as MakEtoUCheckoutResponse
}
