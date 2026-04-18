import { useState, useEffect, useCallback } from 'react';
import { bankingAPI } from '../services/api';

export function useBanking() {
  const [accounts,     setAccounts]     = useState([]);
  const [netWorth,     setNetWorth]     = useState(0);
  const [linkedBanks,  setLinkedBanks]  = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [spending,     setSpending]     = useState([]);
  const [cashflow,     setCashflow]     = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [syncing,      setSyncing]      = useState(false);
  const [error,        setError]        = useState(null);

  const fetchAccounts = useCallback(async () => {
    try {
      const { data } = await bankingAPI.accounts();
      setAccounts(data.accounts);
      setNetWorth(data.netWorth);
      setLinkedBanks(data.linkedBanks);
    } catch (e) {
      setError(e.response?.data?.error || 'Failed to load accounts');
    }
  }, []);

  const fetchTransactions = useCallback(async (days = 30) => {
    try {
      const { data } = await bankingAPI.transactions({ days, limit: 50 });
      setTransactions(data.transactions);
    } catch (e) {
      setError(e.response?.data?.error || 'Failed to load transactions');
    }
  }, []);

  const fetchCharts = useCallback(async (days = 30) => {
    try {
      const [sp, cf] = await Promise.all([
        bankingAPI.spending(days),
        bankingAPI.cashflow(days),
      ]);
      setSpending(sp.data.summary);
      setCashflow(cf.data.flow);
    } catch {}
  }, []);

  const refresh = useCallback(async (days = 30) => {
    setLoading(true);
    await Promise.all([fetchAccounts(), fetchTransactions(days), fetchCharts(days)]);
    setLoading(false);
  }, [fetchAccounts, fetchTransactions, fetchCharts]);

  const forceSync = useCallback(async () => {
    setSyncing(true);
    try {
      await bankingAPI.sync();
      await refresh();
    } finally {
      setSyncing(false);
    }
  }, [refresh]);

  useEffect(() => { refresh(); }, [refresh]);

  return { accounts, netWorth, linkedBanks, transactions, spending, cashflow, loading, syncing, error, refresh, forceSync };
}
