import { useState } from "react";
import { useListForumPosts, getListForumPostsQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, ThumbsUp, CheckCircle, Globe, PenSquare, AlertTriangle } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function Forum() {
  const [category, setCategory] = useState<string>("all");
  
  const { data: forumData, isLoading } = useListForumPosts(
    category !== "all" ? { category } : {},
    { query: { queryKey: getListForumPostsQueryKey(category !== "all" ? { category } : {}) } }
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <Alert className="bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-400">
        <AlertTriangle className="h-4 w-4 !text-amber-600 dark:!text-amber-400" />
        <AlertTitle className="font-bold">Advanced Feature</AlertTitle>
        <AlertDescription>
          This module is partially implemented as a prototype. Core system features are fully functional.
        </AlertDescription>
      </Alert>

      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Farmer Community</h1>
          <p className="text-muted-foreground mt-1">Share knowledge, ask experts, and discuss local markets</p>
        </div>
        <Button className="gap-2"><PenSquare className="w-4 h-4" /> New Post</Button>
      </div>

      <Tabs defaultValue="all" onValueChange={setCategory} className="w-full">
        <TabsList className="bg-card border h-auto flex flex-wrap p-1 gap-1">
          <TabsTrigger value="all" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded">All Posts</TabsTrigger>
          <TabsTrigger value="crop_advisory" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded">Crop Advisory</TabsTrigger>
          <TabsTrigger value="market" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded">Market Intel</TabsTrigger>
          <TabsTrigger value="disease" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded">Diseases & Pests</TabsTrigger>
          <TabsTrigger value="success_story" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded">Success Stories</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="space-y-4">
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <Card key={i} className="animate-pulse h-32"></Card>
            ))}
          </div>
        ) : forumData?.posts.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground bg-card rounded-lg border">No posts found in this category.</div>
        ) : (
          forumData?.posts.map(post => (
            <Card key={post.id} className="shadow-sm hover:shadow-md transition-shadow border-border/50">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row gap-4 md:gap-6">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline" className="capitalize text-xs">{post.category.replace('_', ' ')}</Badge>
                      {post.expertVerified && (
                        <Badge className="bg-blue-500/10 text-blue-700 border-blue-200 gap-1 pl-1">
                          <CheckCircle className="w-3 h-3" /> Expert Verified
                        </Badge>
                      )}
                      <span className="text-xs text-muted-foreground flex items-center gap-1 ml-auto">
                        <Globe className="w-3 h-3" /> {post.language.toUpperCase()}
                      </span>
                    </div>
                    <h3 className="text-xl font-bold text-foreground leading-tight">{post.title}</h3>
                    <p className="text-muted-foreground line-clamp-2 leading-relaxed">{post.content}</p>
                    
                    <div className="flex items-center gap-4 pt-4 text-sm text-muted-foreground">
                      <span className="font-medium text-foreground">{post.authorName}</span>
                      <span>•</span>
                      <span>{post.authorRegion}</span>
                      <span>•</span>
                      <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  
                  <div className="flex md:flex-col items-center justify-end gap-4 md:border-l pl-0 md:pl-6 shrink-0">
                    <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-primary">
                      <ThumbsUp className="w-4 h-4" /> {post.likes}
                    </Button>
                    <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-primary">
                      <MessageSquare className="w-4 h-4" /> {post.replyCount} Replies
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}