'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { searchDAOs, getDAOStats } from '../../../lib/api';
import { formatAddress } from '../../../lib/wallet';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card';
import { Alert, AlertDescription } from '../../../components/ui/alert';
import AuditArmyLogo from '../../../components/ui/audit-army-logo';

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
    <div>
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Search Section */}
        <div className="mb-8">
          <div className="relative">
            <Input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search DAOs by name, symbol, or description..."
              className="w-full p-4 pl-12 bg-muted border-border text-foreground placeholder-muted-foreground focus:border-primary"
            />
            <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground pointer-events-none">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
        </div>

        {/* DAOs List */}
        {loading && (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <p className="mt-4 text-muted-foreground">Loading DAOs...</p>
          </div>
        )}

        {error && (
          <Alert className="border-destructive bg-destructive/10 camo-border mb-8">
            <AlertDescription className="text-destructive">
              <h3 className="text-xl font-bold mb-2">Error</h3>
              <p>{error}</p>
            </AlertDescription>
          </Alert>
        )}

        {!loading && !error && daos.length === 0 && (
          <Card className="bg-card border-border camo-border">
            <CardContent className="p-12 text-center">
              <CardTitle className="text-xl font-semibold mb-2 text-foreground">No DAOs Found</CardTitle>
              <CardDescription className="text-muted-foreground mb-6">
                {searchTerm ? 'Try adjusting your search terms' : 'Be the first to create a DAO!'}
              </CardDescription>
              {!searchTerm && (
                <Link href="/dao/create">
                  <Button className="bg-primary hover:bg-primary/90 camo-border">
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
              <Card key={dao.id} className={`bg-card border-border hover:border-primary camo-border ${dao.isUserCreated ? 'ring-2 ring-primary ring-opacity-50' : ''}`}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="mb-1">
                        <CardTitle className="text-xl font-bold text-foreground">{dao.name}</CardTitle>
                      </div>
                      <CardDescription className="text-primary font-mono text-sm">{dao.symbol}</CardDescription>
                    </div>
                    {dao.logoUrl ? (
                      <img src={dao.logoUrl} alt={dao.name} className="w-12 h-12 rounded-lg" />
                    ) : (
                      <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center">
                        <span className="text-muted-foreground text-xs">{dao.symbol.slice(0, 2)}</span>
                      </div>
                    )}
                  </div>
                  
                  <CardDescription className="text-muted-foreground mb-4 line-clamp-3">{dao.description}</CardDescription>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Created:</span>
                      <span>{formatDate(dao.createdAt)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Creator:</span>
                      <span className="font-mono text-xs">{formatAddress(dao.creatorWallet)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Contract:</span>
                      <span className="font-mono text-xs text-primary hover:text-primary/80 cursor-pointer" 
                            title={dao.contractAddress}
                            onClick={() => navigator.clipboard.writeText(dao.contractAddress)}>
                        {formatAddress(dao.contractAddress)}
                      </span>
                    </div>
                  </div>
                  
                  <div className="mt-4 pt-4 border-t border-border">
                    <Link href={`/dao/${dao.id}`}>
                      <Button className="w-full bg-primary hover:bg-primary/90 camo-border">
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
