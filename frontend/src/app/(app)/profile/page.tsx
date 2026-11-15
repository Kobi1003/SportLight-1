
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { usePlayers } from "@/hooks/use-players";
import { useClubs } from "@/hooks/use-clubs";
import { useToast } from "@/hooks/use-toast";
import { AchievementGenerator } from "@/components/profile/achievement-generator";
import { useState, useEffect } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ALL_SPORTS, PerformanceMetric, Player, Club } from "@/lib/mock-data";
import { PlusCircle, Trash2, CalendarIcon, LogOut, Loader } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const playerFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  sport: z.enum(ALL_SPORTS),
  age: z.coerce.number().min(1, "Age is required"),
  location: z.string().min(1, "Location is required"),
  mobile: z.string().min(10, "Mobile number must be at least 10 digits."),
  height: z.coerce.number().min(1, "Height is required"),
  weight: z.coerce.number().min(1, "Weight is required"),
  gender: z.enum(["Male", "Female"]),
  dreamClub: z.string().optional(),
  skills: z.string().min(1, "At least one skill is required"),
  achievementsText: z.string().min(1, "Achievements text is required"),
});

const clubFormSchema = z.object({
  name: z.string().min(1, "Club name is required"),
  address: z.string().min(1, "Address is required"),
  foundationDate: z.date({
    required_error: "A foundation date is required.",
  }),
  registrationDate: z.date({
    required_error: "A registration date is required.",
  }),
  contactPerson: z.string().min(1, "Contact person is required"),
  contactMobile: z.string().min(10, "Mobile number must be at least 10 digits."),
  contactEmail: z.string().email("Invalid email address"),
});


function ProfileSkeleton() {
    return (
        <Card className="max-w-lg mx-auto">
            <CardHeader>
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-4 w-64" />
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-10 w-full" />
                </div>
                 <div className="space-y-2">
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-10 w-full" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-16" />
                        <Skeleton className="h-10 w-full" />
                    </div>
                     <div className="space-y-2">
                        <Skeleton className="h-4 w-16" />
                        <Skeleton className="h-10 w-full" />
                    </div>
                </div>
            </CardContent>
            <CardFooter>
                 <Skeleton className="h-10 w-32" />
            </CardFooter>
        </Card>
    );
}

export default function ProfilePage() {
  const { players, updatePlayer, deletePlayer } = usePlayers();
  const { clubs, updateClub } = useClubs();
  const { toast } = useToast();
  const router = useRouter();
  
  const [role, setRole] = useState<'player' | 'recruiter' | null>(null);

  useEffect(() => {
    const savedRole = localStorage.getItem('userRole') as 'player' | 'recruiter' | null;
    if (savedRole) {
        setRole(savedRole);
    } else {
        router.push('/login');
    }
  }, [router]);

  const [currentUser, setCurrentUser] = useState<Player | null>(null);
  const [currentClub, setCurrentClub] = useState<Club | null>(null);
  const [playerAvatar, setPlayerAvatar] = useState<string | null>(null);
  const [clubLogo, setClubLogo] = useState<string | null>(null);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [referenceImage, setReferenceImage] = useState<string | null>(null);
  const [performanceData, setPerformanceData] = useState<PerformanceMetric[]>([]);

  const handleSignOut = () => {
    localStorage.removeItem('userRole');
    localStorage.removeItem('token');
    router.push('/login');
  };

  const handleDeleteMyProfile = async () => {
    if (!currentUser) return;
    try {
      await deletePlayer(currentUser.id);
      localStorage.removeItem('token');
      localStorage.removeItem('userRole');
      toast({
        title: "Profile Deleted",
        description: "Your profile has been removed from MongoDB.",
      });
      router.push('/login');
    } catch (e: any) {
      toast({
        variant: "destructive",
        title: "Delete Failed",
        description: e.message || "Could not delete profile.",
      });
    }
  };

  const playerForm = useForm<z.infer<typeof playerFormSchema>>({
    resolver: zodResolver(playerFormSchema),
    defaultValues: {
      name: "", sport: undefined, age: undefined, location: "", mobile: "",
      height: undefined, weight: undefined, gender: undefined, dreamClub: "",
      skills: "", achievementsText: "",
    },
  });
  
  const clubForm = useForm<z.infer<typeof clubFormSchema>>({
    resolver: zodResolver(clubFormSchema),
    defaultValues: {
      name: "", address: "", foundationDate: undefined, registrationDate: undefined, contactPerson: "",
      contactMobile: "", contactEmail: "",
    }
  });

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

    if (role === 'player') {
      if (token) {
        fetch(`${apiBase}/player/me`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        .then(res => res.ok ? res.json() : null)
        .then(dbPlayer => {
          if (dbPlayer) {
            const playerObj: Player = {
              id: dbPlayer._id || dbPlayer.id,
              name: dbPlayer.name || "",
              sport: dbPlayer.sport || "Football",
              age: dbPlayer.age || 20,
              gender: dbPlayer.gender || "Male",
              location: dbPlayer.location || "",
              mobile: dbPlayer.mobile || "",
              height: dbPlayer.height || 0,
              weight: dbPlayer.weight || 0,
              dreamClub: dbPlayer.dreamClub || "",
              skills: dbPlayer.skills || [],
              achievementsText: dbPlayer.achievementsText || "",
              avatar: dbPlayer.avatar || `https://picsum.photos/seed/${dbPlayer._id}/200/200`,
              verified: dbPlayer.profileCompleted || false,
              achievementsImage: dbPlayer.achievementsImage || "",
              performanceData: dbPlayer.performanceData || [],
              creatorEmail: dbPlayer.email || "player@sportlight.com",
              createdAt: dbPlayer.createdAt || new Date().toISOString(),
            };
            setCurrentUser(playerObj);
            playerForm.reset({
              ...playerObj,
              skills: playerObj.skills.join(', '),
            });
            setPerformanceData(playerObj.performanceData || []);
            if (playerObj.avatar) {
              setPlayerAvatar(playerObj.avatar);
            }
            if (playerObj.achievementsImage) {
              setGeneratedImage(playerObj.achievementsImage);
            }
            return;
          }
          // Fallback to players[0]
          if (players.length > 0) {
            const user = players[0];
            setCurrentUser(user);
            playerForm.reset({
              ...user,
              skills: user.skills.join(', '),
            });
            setPerformanceData(user.performanceData || []);
            if (user.achievementsImage) {
              setGeneratedImage(user.achievementsImage);
            }
          }
        })
        .catch(() => {
          if (players.length > 0) {
            const user = players[0];
            setCurrentUser(user);
            playerForm.reset({ ...user, skills: user.skills.join(', ') });
            setPerformanceData(user.performanceData || []);
          }
        });
      } else if (players.length > 0) {
        const user = players[0];
        setCurrentUser(user);
        playerForm.reset({
          ...user,
          skills: user.skills.join(', '),
        });
        setPerformanceData(user.performanceData || []);
        if (user.achievementsImage) {
          setGeneratedImage(user.achievementsImage);
        }
      }
    }
  }, [role, players, playerForm]);

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

    if (role === 'recruiter') {
      if (token) {
        fetch(`${apiBase}/club/me`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        .then(res => res.ok ? res.json() : null)
        .then(dbClub => {
          if (dbClub) {
            const clubObj: Club = {
              id: dbClub._id || dbClub.id,
              name: dbClub.name || "",
              league: dbClub.league || "Premier League",
              location: dbClub.address || dbClub.location || "",
              description: dbClub.description || "",
              scoutingFocus: dbClub.scoutingFocus || [],
              creatorEmail: dbClub.contactEmail || "",
              logo: dbClub.logo || `https://picsum.photos/seed/${dbClub._id}/200/200`,
              verified: dbClub.profileCompleted || false,
              createdAt: dbClub.createdAt || new Date().toISOString(),
              address: dbClub.address || "",
              foundationDate: dbClub.foundationDate || new Date().toISOString().split('T')[0],
              contactPerson: dbClub.contactPerson || "",
              contactMobile: dbClub.contactMobile || "",
              contactEmail: dbClub.contactEmail || "",
            };
            setCurrentClub(clubObj);
            if (clubObj.logo) {
              setClubLogo(clubObj.logo);
            }
            clubForm.reset({
              name: clubObj.name,
              address: clubObj.address,
              foundationDate: clubObj.foundationDate ? new Date(clubObj.foundationDate) : new Date(),
              registrationDate: clubObj.createdAt ? new Date(clubObj.createdAt) : new Date(),
              contactPerson: clubObj.contactPerson,
              contactMobile: clubObj.contactMobile,
              contactEmail: clubObj.contactEmail,
            });
            return;
          }
          if (clubs.length > 0) {
            const club = clubs[0];
            setCurrentClub(club);
            clubForm.reset({
              name: club.name,
              address: club.address,
              foundationDate: new Date(club.foundationDate),
              registrationDate: new Date(club.createdAt),
              contactPerson: club.contactPerson,
              contactMobile: club.contactMobile,
              contactEmail: club.contactEmail,
            });
          }
        })
        .catch(() => {
          if (clubs.length > 0) {
            const club = clubs[0];
            setCurrentClub(club);
          }
        });
      } else if (clubs.length > 0) {
        const club = clubs[0];
        setCurrentClub(club);
        clubForm.reset({
          name: club.name,
          address: club.address,
          foundationDate: new Date(club.foundationDate),
          registrationDate: new Date(club.createdAt),
          contactPerson: club.contactPerson,
          contactMobile: club.contactMobile,
          contactEmail: club.contactEmail,
        });
      }
    }
  }, [role, clubs, clubForm]);

  async function onPlayerSubmit(values: z.infer<typeof playerFormSchema>) {
    if (!currentUser) return;

    const achievementImage = generatedImage || referenceImage || currentUser.achievementsImage || "https://picsum.photos/seed/achievement/600/400";

    const parsedSkills = values.skills ? values.skills.split(",").map((s) => s.trim()).filter(Boolean) : ["General"];

    const updatedPlayer = {
      ...currentUser,
      ...values,
      avatar: playerAvatar || currentUser.avatar || `https://picsum.photos/seed/${currentUser.id}/200/200`,
      skills: parsedSkills,
      achievementsImage: achievementImage,
      performanceData: performanceData,
    };
    
    try {
        await updatePlayer(currentUser.id, updatedPlayer);
        toast({
          title: "Player Profile Updated & Stored in MongoDB!",
          description: "Your profile has been successfully saved to the database.",
        });
    } catch(e) {
        console.error(e);
        toast({
          variant: "destructive",
          title: "Error updating profile",
          description: "There was an issue saving your profile.",
        });
    }
  }

  async function onClubSubmit(values: z.infer<typeof clubFormSchema>) {
    if (!currentClub) return;

    const updatedClubData = {
        name: values.name,
        address: values.address,
        foundationDate: format(values.foundationDate, 'yyyy-MM-dd'),
        createdAt: format(values.registrationDate, 'yyyy-MM-dd'),
        contactPerson: values.contactPerson,
        contactMobile: values.contactMobile,
        contactEmail: values.contactEmail,
        logo: clubLogo || currentClub.logo || `https://picsum.photos/seed/${currentClub.id}/200/200`,
    };
    
    try {
        await updateClub(currentClub.id, updatedClubData);
        toast({
          title: "Club Profile Updated & Stored in MongoDB!",
          description: "The club's profile has been successfully saved to the database.",
        });
    } catch(e) {
        console.error(e);
        toast({
          variant: "destructive",
          title: "Error updating profile",
          description: "There was an issue saving the club's profile.",
        });
    }
  }
  
  const handleAddMetric = () => {
    setPerformanceData([...performanceData, { metric: '', value: 0, unit: '' }]);
  };

  const handleRemoveMetric = (index: number) => {
    const newData = [...performanceData];
    newData.splice(index, 1);
    setPerformanceData(newData);
  };

  const handleMetricChange = (index: number, field: keyof PerformanceMetric, value: string | number) => {
    const newData = [...performanceData];
    (newData[index] as any)[field] = value;
    setPerformanceData(newData);
  };

  if (!role) {
    return (
      <div className="container mx-auto flex h-full items-center justify-center">
        <Loader className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto">
        <div className="mb-8 flex items-center justify-between">
            <div>
                <h1 className="text-4xl font-bold font-headline tracking-tight">Profile Management</h1>
                <p className="text-muted-foreground">Manage your {role === 'player' ? 'player' : 'club'} profile.</p>
            </div>
            <Button variant="outline" onClick={handleSignOut}>
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </Button>
        </div>

        {role === 'player' ? (
          <Tabs defaultValue="player" className="w-full">
            <TabsList className="grid w-full grid-cols-2 max-w-lg mx-auto">
              <TabsTrigger value="player">Player Profile</TabsTrigger>
              <TabsTrigger value="performance">Performance</TabsTrigger>
            </TabsList>
            <TabsContent value="player">
              {!currentUser ? (
                  <ProfileSkeleton />
                ) : (
                  <Card className="max-w-lg mx-auto">
                    <Form {...playerForm}>
                      <form onSubmit={playerForm.handleSubmit(onPlayerSubmit)}>
                        <CardHeader>
                          <CardTitle className="font-headline">Edit Player Profile</CardTitle>
                          <CardDescription>
                            Update your player profile. Click save when you're done.
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="flex items-center gap-4 p-3 rounded-lg border bg-muted/30">
                            <div className="relative w-16 h-16 rounded-full overflow-hidden border-2 border-primary shrink-0">
                              <Image
                                src={playerAvatar || currentUser.avatar || `https://picsum.photos/seed/${currentUser.id}/200/200`}
                                alt="Profile Avatar"
                                fill
                                className="object-cover"
                              />
                            </div>
                            <div className="flex-1 space-y-1">
                              <Label htmlFor="player-avatar" className="text-sm font-medium">Profile Photo</Label>
                              <Input
                                id="player-avatar"
                                type="file"
                                accept="image/*"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    const reader = new FileReader();
                                    reader.onloadend = () => setPlayerAvatar(reader.result as string);
                                    reader.readAsDataURL(file);
                                  }
                                }}
                              />
                            </div>
                          </div>
                          <FormField
                            control={playerForm.control}
                            name="name"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Name</FormLabel>
                                <FormControl>
                                  <Input placeholder="e.g. Alex Johnson" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={playerForm.control}
                            name="sport"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Sport</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select Sport" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {ALL_SPORTS.map(sport => (
                                          <SelectItem key={sport} value={sport}>{sport}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <div className="grid grid-cols-2 gap-4">
                            <FormField
                              control={playerForm.control}
                              name="age"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Age</FormLabel>
                                  <FormControl>
                                    <Input type="number" placeholder="e.g. 22" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={playerForm.control}
                              name="gender"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Gender</FormLabel>
                                  <Select onValueChange={field.onChange} value={field.value} defaultValue={field.value}>
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select gender" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      <SelectItem value="Male">Male</SelectItem>
                                      <SelectItem value="Female">Female</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                          <FormField
                            control={playerForm.control}
                            name="location"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Location</FormLabel>
                                <FormControl>
                                  <Input placeholder="e.g. Mumbai, India" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={playerForm.control}
                            name="mobile"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Mobile Number</FormLabel>
                                <FormControl>
                                  <Input type="tel" placeholder="e.g. +91 98765 43210" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={playerForm.control}
                                name="height"
                                render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Height (cm)</FormLabel>
                                    <FormControl>
                                    <Input type="number" placeholder="e.g. 180" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                                )}
                            />
                            <FormField
                                control={playerForm.control}
                                name="weight"
                                render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Weight (kg)</FormLabel>
                                    <FormControl>
                                    <Input type="number" placeholder="e.g. 75" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                                )}
                            />
                          </div>
                          <FormField
                            control={playerForm.control}
                            name="dreamClub"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Dream Club (Optional)</FormLabel>
                                <FormControl>
                                  <Input placeholder="e.g. Manchester United" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={playerForm.control}
                            name="skills"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Skills</FormLabel>
                                <FormControl>
                                  <Input placeholder="Dribbling, Passing, Shooting" {...field} />
                                </FormControl>
                                <FormDescription>
                                  Enter skills separated by commas.
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={playerForm.control}
                            name="achievementsText"
                            render={({ field }) => (
                                <AchievementGenerator
                                    textValue={field.value}
                                    onTextChange={field.onChange}
                                    onImageGenerated={setGeneratedImage}
                                    onReferenceImageSelected={setReferenceImage}
                                />
                            )}
                            />
                        </CardContent>
                        <CardFooter className="flex justify-between items-center">
                          <Button type="submit">Save Changes</Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="destructive" type="button" size="sm">
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete Profile
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Your Player Profile?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This action is permanent and cannot be undone. Your profile data and records will be deleted from MongoDB.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={handleDeleteMyProfile}>
                                  Confirm Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </CardFooter>
                      </form>
                    </Form>
                  </Card>
                )}
            </TabsContent>
            <TabsContent value="performance">
              <Card className="max-w-lg mx-auto">
                <CardHeader>
                  <CardTitle className="font-headline">Performance Metrics</CardTitle>
                  <CardDescription>
                    Add or update key performance indicators for your selected sport. This helps clubs benchmark your abilities.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {performanceData.map((metric, index) => (
                    <div key={index} className="grid grid-cols-12 gap-2 items-center">
                      <Input 
                        placeholder="Metric Name" 
                        value={metric.metric}
                        onChange={(e) => handleMetricChange(index, 'metric', e.target.value)}
                        className="col-span-5"
                      />
                      <Input 
                        type="number" 
                        placeholder="Value" 
                        value={metric.value}
                        onChange={(e) => handleMetricChange(index, 'value', parseFloat(e.target.value))}
                        className="col-span-3"
                      />
                      <Input 
                        placeholder="Unit" 
                        value={metric.unit}
                        onChange={(e) => handleMetricChange(index, 'unit', e.target.value)}
                        className="col-span-3"
                      />
                      <Button variant="ghost" size="icon" onClick={() => handleRemoveMetric(index)} className="col-span-1">
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  ))}
                  <Button variant="outline" onClick={handleAddMetric}>
                    <PlusCircle className="mr-2 h-4 w-4" /> Add Metric
                  </Button>
                </CardContent>
                <CardFooter>
                    <p className="text-xs text-muted-foreground">This data will be saved with your player profile.</p>
                  </CardFooter>
              </Card>
            </TabsContent>
          </Tabs>
        ) : (
          <Tabs defaultValue="club" className="w-full">
            <TabsList className="grid w-full grid-cols-1 max-w-sm mx-auto">
              <TabsTrigger value="club">Club Profile</TabsTrigger>
            </TabsList>
            <TabsContent value="club">
              {!currentClub ? (
                  <ProfileSkeleton />
                ) : (
              <Card className="max-w-xl mx-auto">
                <Form {...clubForm}>
                    <form onSubmit={clubForm.handleSubmit(onClubSubmit)}>
                      <CardHeader>
                        <CardTitle className="font-headline">Edit Club Profile</CardTitle>
                        <CardDescription>
                          Manage your club's profile information.
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <FormField
                          control={clubForm.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Name of the Club</FormLabel>
                              <FormControl><Input placeholder="e.g., Mumbai Indians" {...field} /></FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={clubForm.control}
                          name="address"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Registered Address</FormLabel>
                              <FormControl><Textarea placeholder="Enter the club's registered address" {...field} /></FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                              control={clubForm.control}
                              name="foundationDate"
                              render={({ field }) => (
                                <FormItem className="flex flex-col">
                                  <FormLabel>Club Foundation Date</FormLabel>
                                  <Popover>
                                    <PopoverTrigger asChild>
                                      <FormControl>
                                        <Button
                                          variant={"outline"}
                                          className={cn(
                                            "w-full pl-3 text-left font-normal",
                                            !field.value && "text-muted-foreground"
                                          )}
                                        >
                                          {field.value ? (
                                            format(field.value, "PPP")
                                          ) : (
                                            <span>Pick a date</span>
                                          )}
                                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                        </Button>
                                      </FormControl>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                      <Calendar
                                        mode="single"
                                        selected={field.value}
                                        onSelect={field.onChange}
                                        disabled={(date) =>
                                          date > new Date() || date < new Date("1800-01-01")
                                        }
                                        initialFocus
                                      />
                                    </PopoverContent>
                                  </Popover>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={clubForm.control}
                              name="registrationDate"
                              render={({ field }) => (
                                <FormItem className="flex flex-col">
                                  <FormLabel>Date of Registration</FormLabel>
                                  <Popover>
                                    <PopoverTrigger asChild>
                                      <FormControl>
                                        <Button
                                          variant={"outline"}
                                          className={cn(
                                            "w-full pl-3 text-left font-normal",
                                            !field.value && "text-muted-foreground"
                                          )}
                                        >
                                          {field.value ? (
                                            format(field.value, "PPP")
                                          ) : (
                                            <span>Pick a date</span>
                                          )}
                                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                        </Button>
                                      </FormControl>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                      <Calendar
                                        mode="single"
                                        selected={field.value}
                                        onSelect={field.onChange}
                                        disabled={(date) =>
                                          date > new Date() || date < new Date("1800-01-01")
                                        }
                                        initialFocus
                                      />
                                    </PopoverContent>
                                  </Popover>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                              control={clubForm.control}
                              name="contactPerson"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Contact Person</FormLabel>
                                  <FormControl><Input placeholder="e.g., Anshul Gupta" {...field} /></FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={clubForm.control}
                              name="contactMobile"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Mobile No.</FormLabel>
                                  <FormControl><Input type="tel" placeholder="+91 98765 43210" {...field} /></FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                        </div>
                        <FormField
                          control={clubForm.control}
                          name="contactEmail"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Email</FormLabel>
                              <FormControl><Input type="email" placeholder="contact@mumbaiindians.com" {...field} /></FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                              <Label htmlFor="affiliation-docs">Affiliation Documents</Label>
                              <Input id="affiliation-docs" type="file" />
                              <p className="text-xs text-muted-foreground">Upload affiliation proof.</p>
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="club-logo">Club Stamp (or Logo)</Label>
                              <div className="flex items-center gap-3">
                                {clubLogo && (
                                  <div className="relative w-12 h-12 rounded border overflow-hidden shrink-0">
                                    <Image src={clubLogo} alt="Club logo preview" fill className="object-cover" />
                                  </div>
                                )}
                                <Input
                                  id="club-logo"
                                  type="file"
                                  accept="image/*"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                      const reader = new FileReader();
                                      reader.onloadend = () => setClubLogo(reader.result as string);
                                      reader.readAsDataURL(file);
                                    }
                                  }}
                                />
                              </div>
                              <p className="text-xs text-muted-foreground">Upload the club's official logo.</p>
                            </div>
                        </div>
                      </CardContent>
                      <CardFooter>
                        <Button type="submit">Save Club Profile</Button>
                      </CardFooter>
                    </form>
                  </Form>
              </Card>
              )}
            </TabsContent>
          </Tabs>
        )}
    </div>
  );
}
