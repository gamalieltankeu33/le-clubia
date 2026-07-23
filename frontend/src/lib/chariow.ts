import { supabase } from './supabase'

export interface ChariowCheckoutParams {
  planId: 'trial' | 'trimestrial' | 'semestrial' | 'annual'
  email: string
  firstName?: string
  lastName?: string
  phone?: string
  redirectURL?: string
  meta?: Record<string, any>
}

export interface ChariowCheckoutResponse {
  id: string
  url: string
}

export async function createChariowCheckout(params: ChariowCheckoutParams): Promise<ChariowCheckoutResponse> {
  const { data, error } = await supabase.functions.invoke('chariow-checkout', {
    body: params,
  })

  if (error) {
    console.error('Chariow Checkout Error:', error)
    throw new Error(error.message || 'Erreur lors de l\'initialisation du paiement')
  }

  if (data.error) {
    throw new Error(data.error)
  }

  return data as ChariowCheckoutResponse
}
