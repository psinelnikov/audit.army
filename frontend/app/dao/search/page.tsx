'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { searchDAOs, getDAOStats } from '../../../lib/api';
import { formatAddress } from '../../../lib/wallet';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card';
import { Alert, AlertDescription } from '../../../components/ui/alert';

interface DAO {
  id: number;
  name: string;
  symbol: string;
  description: string;
  contractAddress: string;
  creatorWallet: string;
  createdAt: string;
  logoUrl?: string;
  isUserCreated?: boolean;
}

interface DAOStats {
  total: number;
  thisMonth: number;
  thisWeek: number;
}

export default function DAOSearchPage() {
  const [daos, setDAOs] = useState<DAO[]>([]);
  const [stats, setStats] = useState<DAOStats | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDAOs();
    loadStats();
  }, []);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchTerm !== undefined) {
        loadDAOs(searchTerm);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  const loadDAOs = async (search?: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await searchDAOs(search);
      if (response.success) {
        setDAOs(response.data.daos);
      } else {
        setError(response.error || 'Failed to load DAOs');
      }
    } catch (err) {
      setError('Failed to load DAOs');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await getDAOStats();
      if (response.success) {
        setStats(response.data);
      }
    } catch (err) {
      console.error('Failed to load stats:', err);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <Link href="/" className="text-blue-400 hover:underline mb-8 inline-block">
          ← Back to Home
        </Link>

        <h1 className="text-4xl font-bold mb-8">Explore DAOs</h1>

        {/* Stats Section */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-6">
                <CardTitle className="text-2xl font-bold text-blue-400">{stats.total}</CardTitle>
                <CardDescription className="text-gray-300">Total DAOs</CardDescription>
              </CardContent>
            </Card>
            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-6">
                <CardTitle className="text-2xl font-bold text-green-400">{stats.thisMonth}</CardTitle>
                <CardDescription className="text-gray-300">Created This Month</CardDescription>
              </CardContent>
            </Card>
            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-6">
                <CardTitle className="text-2xl font-bold text-purple-400">{stats.thisWeek}</CardTitle>
                <CardDescription className="text-gray-300">Created This Week</CardDescription>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Search Section */}
        <div className="mb-8">
          <div className="relative">
            <Input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search DAOs by name, symbol, or description..."
              className="w-full p-4 pl-12 bg-gray-800 border-gray-700 text-white placeholder-gray-400 focus:border-blue-500"
            />
            <div className="absolute left-4 top-4 text-gray-400">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Create DAO CTA */}
        <Card className="mb-8 bg-gradient-to-r from-blue-600 to-purple-600 border-blue-600">
          <CardContent className="p-8 text-center">
            <CardTitle className="text-2xl font-bold mb-4 text-white">Create Your Own DAO</CardTitle>
            <CardDescription className="mb-6 text-blue-100">
              Start your decentralized auditing community today
            </CardDescription>
            <Link href="/dao/create">
              <Button className="bg-white text-blue-600 hover:bg-gray-100">
                Create DAO →
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* DAOs List */}
        {loading && (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
            <p className="mt-4 text-gray-400">Loading DAOs...</p>
          </div>
        )}

        {error && (
          <Alert className="border-red-700 bg-red-900 mb-8">
            <AlertDescription className="text-red-200">
              <h3 className="text-xl font-bold mb-2">Error</h3>
              <p>{error}</p>
            </AlertDescription>
          </Alert>
        )}

        {!loading && !error && daos.length === 0 && (
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-12 text-center">
              <CardTitle className="text-xl font-semibold mb-2 text-white">No DAOs Found</CardTitle>
              <CardDescription className="text-gray-400 mb-6">
                {searchTerm ? 'Try adjusting your search terms' : 'Be the first to create a DAO!'}
              </CardDescription>
              {!searchTerm && (
                <Link href="/dao/create">
                  <Button className="bg-blue-600 hover:bg-blue-700">
                    Create DAO
                  </Button>
                </Link>
              )}
            </CardContent>
          </Card>
        )}

        {!loading && !error && daos.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {daos.map((dao) => (
              <Card key={dao.id} className={`bg-gray-800 border-gray-700 hover:border-blue-500 ${dao.isUserCreated ? 'ring-2 ring-green-600 ring-opacity-50' : ''}`}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <CardTitle className="text-xl font-bold text-white">{dao.name}</CardTitle>
                        {dao.isUserCreated && (
                          <span className="bg-green-600 text-white text-xs px-2 py-1 rounded-full font-semibold">
                            USER CREATED
                          </span>
                        )}
                      </div>
                      <CardDescription className="text-blue-400 font-mono text-sm">{dao.symbol}</CardDescription>
                    </div>
                    {dao.logoUrl ? (
                      <img src={dao.logoUrl} alt={dao.name} className="w-12 h-12 rounded-lg" />
                    ) : (
                      <div className="w-12 h-12 bg-gray-700 rounded-lg flex items-center justify-center">
                        <span className="text-gray-400 text-xs">{dao.symbol.slice(0, 2)}</span>
                      </div>
                    )}
                  </div>
                  
                  <CardDescription className="text-gray-300 mb-4 line-clamp-3">{dao.description}</CardDescription>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Created:</span>
                      <span>{formatDate(dao.createdAt)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Creator:</span>
                      <span className="font-mono text-xs">{formatAddress(dao.creatorWallet)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Contract:</span>
                      <span className="font-mono text-xs text-blue-400 hover:text-blue-300 cursor-pointer" 
                            title={dao.contractAddress}
                            onClick={() => navigator.clipboard.writeText(dao.contractAddress)}>
                        {formatAddress(dao.contractAddress)}
                      </span>
                    </div>
                  </div>
                  
                  <div className="mt-4 pt-4 border-t border-gray-700">
                    <Link href={`/dao/${dao.id}`}>
                      <Button className="w-full bg-blue-600 hover:bg-blue-700">
                        View Details →
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
