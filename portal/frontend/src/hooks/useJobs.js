import { useState, useCallback, useRef } from "react";
import api from "../services/api";

/**
 * Custom hook for managing jobs state and operations
 */
export function useJobs(pageSize = 5) {
  const [jobs, setJobs] = useState([]);
  const [jobsLoading, setJobsLoading] = useState(false);
  const [jobsError, setJobsError] = useState(null);
  const [selectedJob, setSelectedJob] = useState(null);
  const [jobDetailLoading, setJobDetailLoading] = useState(false);
  const [jobDetailError, setJobDetailError] = useState(null);
  const [jobDetailsCache, setJobDetailsCache] = useState({});
  const [jobsPage, setJobsPage] = useState(1);

  // Use ref to avoid stale closures
  const cacheRef = useRef(jobDetailsCache);
  cacheRef.current = jobDetailsCache;

  // Load job details with caching
  const loadJobDetail = useCallback(async (job) => {
    if (!job) return;

    setJobDetailError(null);

    // Check cache first
    const cached = cacheRef.current[job.number];
    if (cached && cached.outputs !== undefined) {
      setSelectedJob(cached);
      return;
    }

    // Set initial state
    setSelectedJob((current) => {
      if (current && current.number === job.number) {
        return current;
      }
      return { ...job, outputs: undefined };
    });

    setJobDetailLoading(true);

    try {
      const data = await api.fetchJobDetail(job.number);
      setJobDetailsCache((prev) => ({
        ...prev,
        [data.number]: data
      }));
      setSelectedJob(data);
    } catch (err) {
      console.error(err);
      setJobDetailError(err.message || "Failed to load job details");
    } finally {
      setJobDetailLoading(false);
    }
  }, []);

  // Refresh jobs list
  const refreshJobs = useCallback(async () => {
    setJobsLoading(true);
    setJobsError(null);

    try {
      const data = await api.fetchJobs();
      const safe = Array.isArray(data) ? data : [];
      setJobs(safe);
      setJobsPage(1);

      if (safe.length > 0) {
        loadJobDetail(safe[0]);
      } else {
        setSelectedJob(null);
      }
    } catch (err) {
      console.error(err);
      setJobsError(err.message || "Failed to load jobs");
    } finally {
      setJobsLoading(false);
    }
  }, [loadJobDetail]);

  // Pagination helpers
  const totalPages = Math.max(1, Math.ceil(jobs.length / pageSize));
  const currentPage = Math.min(jobsPage, totalPages);
  const startIndex = (currentPage - 1) * pageSize;
  const pageJobs = jobs.slice(startIndex, startIndex + pageSize);

  return {
    jobs: pageJobs,
    allJobs: jobs,
    jobsLoading,
    jobsError,
    selectedJob,
    jobDetailLoading,
    jobDetailError,
    currentPage,
    totalPages,
    setJobsPage,
    refreshJobs,
    loadJobDetail
  };
}
