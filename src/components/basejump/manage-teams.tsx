import { Target } from "lucide-react";
import Link from "next/link";

import { createClient } from "@lib/supabase/server";

import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Table, TableRow, TableBody, TableCell } from "../ui/table";

import { SetPostingTeamButton } from "./set-posting-team-button";

interface Team {
  account_id: string;
  name: string;
  slug: string;
  personal_account: boolean;
  account_role: string;
  is_primary_owner: boolean;
}

export default async function ManageTeams() {
  const supabaseClient = createClient();

  const { data } = await supabaseClient.rpc("get_accounts");
  const { data: personalAccount } = await supabaseClient.rpc("get_personal_account");

  const teams: Team[] = data?.filter((team: Team) => !team.personal_account) ?? [];
  const currentPostingTeamId =
    personalAccount?.metadata?.posting_team_id ?? personalAccount?.account_id;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Teams</CardTitle>
        <CardDescription>These are the teams you belong to</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableBody>
            {teams.map((team) => {
              const isPostingTeam = team.account_id === currentPostingTeamId;

              return (
                <TableRow key={team.account_id}>
                  <TableCell>
                    <div className="flex gap-x-2">
                      {team.name}
                      <Badge variant={team.account_role === "owner" ? "default" : "outline"}>
                        {team.is_primary_owner ? "Primary Owner" : team.account_role}
                      </Badge>
                      {isPostingTeam && (
                        <Badge variant="secondary" className="bg-green-100 text-green-800">
                          <Target className="mr-1 h-3 w-3" />
                          Posting Team
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-x-2">
                      {!isPostingTeam && (
                        <SetPostingTeamButton
                          teamId={team.account_id}
                          personalAccountId={personalAccount.account_id}
                        />
                      )}
                      <Button variant="outline" asChild>
                        <Link href={`/dashboard/${team.slug}`}>View</Link>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
